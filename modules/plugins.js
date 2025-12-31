const EventEmitter = require('events');
const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

// Create singleton EventEmitter instance
const eventEmitter = new EventEmitter();

/**
 * Load all plugins from the plugins directory
 * @param {string} pluginsDirectory - Path to the plugins directory
 */
const loadPlugins = (pluginsDirectory) => {
    // Resolve to absolute path
    const absolutePluginsDir = path.isAbsolute(pluginsDirectory) ? pluginsDirectory : path.resolve(process.cwd(), pluginsDirectory);

    // Create plugins directory if it doesn't exist
    if (!fs.existsSync(absolutePluginsDir)) {
        console.log(chalk.yellow(`Warning: Plugins directory does not exist: ${absolutePluginsDir}`));
        try {
            fs.mkdirSync(absolutePluginsDir, {recursive: true});
            console.log(chalk.green(`Created plugins directory: ${absolutePluginsDir}`));
        } catch (error) {
            console.log(chalk.red(`Error creating plugins directory: ${error.message}`));
            return;
        }
        return;
    }

    // Read all .js files from plugins directory
    let pluginFiles = [];
    try {
        pluginFiles = fs.readdirSync(absolutePluginsDir).filter((file) => {
            return path.extname(file).toLowerCase() === '.js' && file.indexOf('.example.js') === -1;
        });
    } catch (error) {
        console.log(chalk.yellow(`Warning: Could not read plugins directory: ${absolutePluginsDir}`));
        return;
    }

    if (pluginFiles.length === 0) {
        console.log(chalk.yellow(`Warning: No plugins found in ${absolutePluginsDir}`));
        return;
    }

    console.log(chalk.cyan(`Loading ${pluginFiles.length} plugin(s) from ${absolutePluginsDir}...`));

    // Load each plugin file
    let pluginCount = pluginFiles.length;
    pluginFiles.forEach((file, index) => {
        try {
            const pluginPath = path.join(absolutePluginsDir, file);
            const plugin = require(pluginPath);

            // Validate plugin structure
            if (!plugin || typeof plugin !== 'object') {
                console.log(chalk.yellow(`Warning: Plugin ${file} does not export an object. Skipping.`));
                return;
            }

            if (!plugin.event || typeof plugin.event !== 'string') {
                console.log(chalk.yellow(`Warning: Plugin ${file} does not export a valid 'event' string. Skipping.`));
                return;
            }

            if (!plugin.handler || typeof plugin.handler !== 'function') {
                console.log(chalk.yellow(`Warning: Plugin ${file} does not export a valid 'handler' function. Skipping.`));
                return;
            }

            // Register the handler with EventEmitter
            eventEmitter.on(plugin.event, plugin.handler);
            console.log(`* ${index + 1} of ${pluginCount} ---------------`);
            console.log(`| Plugin name: ${chalk.blue(plugin?.name || file)}`);
            console.log(`| Plugin description: ${chalk.blue(plugin?.description || 'Unknown')}`);
            console.log(`| Plugin event: ${chalk.blue(plugin.event)}`);
            console.log(`| Plugin version: ${chalk.blue(plugin?.version || 'Unknown')}`);
            console.log(`| Plugin author: ${chalk.blue(plugin?.author || 'Unknown')}`);
            console.log(`*----------------------------------------`);
        } catch (error) {
            console.log(chalk.red(`Error loading plugin ${file}: ${error.message}`));
        }
    });
};

/**
 * Emit an async event and await all listeners
 * @param {string} eventName - Name of the event to emit
 * @param {object} data - Data object to pass to event handlers
 * @returns {Promise<object>} - Modified data object (or original if no modifications)
 */
const emitAsync = async (eventName, data) => {
    const listeners = eventEmitter.listeners(eventName);

    if (listeners.length === 0) {
        return data;
    }

    // Execute all listeners in parallel and collect results
    const results = await Promise.allSettled(
        listeners.map(async (listener) => {
            try {
                return await listener(data);
            } catch (error) {
                console.log(chalk.red(`Error in plugin handler for event '${eventName}': ${error.message}`));
                return null; // Return null on error to skip this result
            }
        }),
    );

    // Merge all successful results with the original data
    // Plugins can modify data in place (mutation) or return modifications
    let mergedData = {...data};

    results.forEach((result) => {
        if (result.status === 'fulfilled' && result.value !== undefined && result.value !== null) {
            // If the returned value is an object, merge it with the accumulated data
            if (typeof result.value === 'object') {
                mergedData = {...mergedData, ...result.value};
            }
        }
    });

    return mergedData;
};

module.exports = {
    eventEmitter,
    loadPlugins,
    emitAsync,
};
