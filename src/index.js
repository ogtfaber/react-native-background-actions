import { Platform, AppRegistry } from 'react-native';
import { RNBackgroundActions, nativeEventEmitter } from './RNBackgroundActionsModule';
import EventEmitter from 'eventemitter3';

/**
 * @typedef {{
 *            taskTitle: string,
 *            taskDesc: string,
 *            taskIcon: {name: string, type: string, package?: string},
 *            color?: string
 *            linkingURI?: string,
 *            progressBar?: {max: number, value: number, indeterminate?: boolean}
 *            }} BackgroundTaskOptions
 */

/**
 * @typedef {{
 *          executor: (parameters?: any) => Promise<void>,
 *          options: BackgroundTaskOptions & {taskName: string},
 *          stopCallback?: () => void
 *         }} TaskDefinition
 */

/**
 * @typedef {Record<string, TaskDefinition>} TasksMap
 */

/**
 * @typedef {Record<string, boolean>} RunningTasksMap
 */

class BackgroundServer extends EventEmitter {
    constructor() {
        super();
        /** @type {TasksMap} */
        this._tasks = {};
        /** @type {RunningTasksMap} */
        this._isRunningMap = {};
        /** @private */
        this._addListeners();
    }

    /**
     * @private
     */
    _addListeners() {
        nativeEventEmitter.addListener('expiration', (data) => {
            const taskName = (data && data.taskName) || '';
            this.emit('expiration', { taskName });
        });
    }

    /**
     * **ANDROID ONLY**
     *
     * Updates the task notification.
     *
     * *On iOS this method will return immediately if it's not Android*
     *
     * @param {string} taskName - The name of the task to update
     * @param {{taskTitle?: string,
     *          taskDesc?: string,
     *          taskIcon?: {name: string, type: string, package?: string},
     *          color?: string,
     *          linkingURI?: string,
     *          progressBar?: {max: number, value: number, indeterminate?: boolean}}} taskData
     */
    async updateNotification(taskName, taskData) {
        if (Platform.OS !== 'android') return;
        if (!this.isRunning(taskName))
            throw new Error(
                `The task "${taskName}" must be running before updating the notification`
            );

        const currentOptions = this._tasks[taskName].options;
        const updatedOptions = { ...currentOptions, ...taskData, taskName };
        await RNBackgroundActions.updateNotification(updatedOptions);
    }

    /**
     * Returns if the specified background task is running.
     *
     * It returns `true` if `startTask()` has been called and the task has not finished.
     *
     * It returns `false` if `stopTask()` has been called, **even if the task has not finished**.
     *
     * @param {string} taskName - The name of the task to check
     * @returns {boolean}
     */
    isRunning(taskName) {
        return !!this._isRunningMap[taskName];
    }

    /**
     * Get all registered task names
     *
     * @returns {string[]} Array of registered task names
     */
    getRegisteredTaskNames() {
        return Object.keys(this._tasks);
    }

    /**
     * Get all running task names
     *
     * @returns {string[]} Array of running task names
     */
    getRunningTaskNames() {
        return Object.keys(this._isRunningMap).filter((taskName) => this._isRunningMap[taskName]);
    }

    /**
     * @template T
     *
     * @param {string} taskName - Unique identifier for the task
     * @param {(taskData?: T) => Promise<void>} taskExecutor - Function to execute when task runs
     * @param {BackgroundTaskOptions} options - Options for the task
     * @returns {Promise<void>}
     */
    async defineTask(taskName, taskExecutor, options) {
        if (!taskName) throw new Error('Task name cannot be empty');

        /** @type {TaskDefinition} */
        const taskDefinition = {
            executor: taskExecutor,
            options: {
                ...options,
                taskName,
            },
        };

        this._tasks[taskName] = taskDefinition;
    }

    /**
     * @template T
     *
     * @param {string} taskName - The name of the task to start
     * @param {T} [parameters] - Optional parameters to pass to the task
     * @returns {Promise<void>}
     */
    async startTask(taskName, parameters) {
        if (!taskName || !this._tasks[taskName])
            throw new Error(
                `Task "${taskName}" not found. Make sure to define it first with defineTask().`
            );

        const { executor, options } = this._tasks[taskName];
        const finalOptions = {
            ...options,
            parameters,
        };

        const finalTask = this._generateTask(taskName, executor, parameters);

        if (Platform.OS === 'android') {
            // Register the headless task with Android
            AppRegistry.registerHeadlessTask(taskName, () => finalTask);
            await RNBackgroundActions.start(finalOptions);
            this._isRunningMap[taskName] = true;
        } else {
            // On iOS just start the task directly
            await RNBackgroundActions.start(finalOptions);
            this._isRunningMap[taskName] = true;
            finalTask();
        }
    }

    /**
     * @private
     * @template T
     * @param {string} taskName
     * @param {(taskData?: T) => Promise<void>} executor
     * @param {T} [parameters]
     * @returns {() => Promise<void>}
     */
    _generateTask(taskName, executor, parameters) {
        const self = this;
        return async () => {
            await new Promise((resolve) => {
                if (self._tasks[taskName]) self._tasks[taskName].stopCallback = resolve;
                executor(parameters)
                    .then(() => self.stopTask(taskName))
                    .catch((error) => {
                        console.error(`Task "${taskName}" failed:`, error);
                        self.stopTask(taskName);
                    });
            });
        };
    }

    /**
     * Stops the specified background task.
     *
     * @param {string} taskName - The name of the task to stop
     * @returns {Promise<void>}
     */
    async stopTask(taskName) {
        if (!taskName || !this._tasks[taskName]) throw new Error(`Task "${taskName}" not found`);

        const task = this._tasks[taskName];
        if (task && task.stopCallback) task.stopCallback();

        await RNBackgroundActions.stop(taskName);
        this._isRunningMap[taskName] = false;
    }

    /**
     * Stops all running background tasks.
     *
     * @returns {Promise<void>}
     */
    async stopAllTasks() {
        const runningTasks = this.getRunningTaskNames();
        await Promise.all(runningTasks.map((taskName) => this.stopTask(taskName)));
    }
}

const backgroundServer = new BackgroundServer();

export default backgroundServer;
