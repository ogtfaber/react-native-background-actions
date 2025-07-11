export default backgroundServer;
export type BackgroundTaskOptions = {
    taskTitle: string;
    taskDesc: string;
    taskIcon: {
        name: string;
        type: string;
        package?: string;
    };
    color?: string | undefined;
    linkingURI?: string | undefined;
    progressBar?: {
        max: number;
        value: number;
        indeterminate?: boolean | undefined;
    } | undefined;
};
export type TaskDefinition = {
    executor: (parameters?: any) => Promise<void>;
    options: BackgroundTaskOptions & {
        taskName: string;
    };
    stopCallback?: (() => void) | undefined;
};
export type TasksMap = {
    [x: string]: {
        executor: (parameters?: any) => Promise<void>;
        options: BackgroundTaskOptions & {
            taskName: string;
        };
        stopCallback?: (() => void) | undefined;
    };
};
export type RunningTasksMap = {
    [x: string]: boolean;
};
declare const backgroundServer: BackgroundServer;
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
declare class BackgroundServer extends EventEmitter<string | symbol, any> {
    /** @type {TasksMap} */
    _tasks: TasksMap;
    /** @type {RunningTasksMap} */
    _isRunningMap: RunningTasksMap;
    /**
     * @private
     */
    private _addListeners;
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
    updateNotification(taskName: string, taskData: {
        taskTitle?: string;
        taskDesc?: string;
        taskIcon?: {
            name: string;
            type: string;
            package?: string;
        };
        color?: string;
        linkingURI?: string;
        progressBar?: {
            max: number;
            value: number;
            indeterminate?: boolean;
        };
    }): Promise<void>;
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
    isRunning(taskName: string): boolean;
    /**
     * Get all registered task names
     *
     * @returns {string[]} Array of registered task names
     */
    getRegisteredTaskNames(): string[];
    /**
     * Get all running task names
     *
     * @returns {string[]} Array of running task names
     */
    getRunningTaskNames(): string[];
    /**
     * @template T
     *
     * @param {string} taskName - Unique identifier for the task
     * @param {(taskData?: T) => Promise<void>} taskExecutor - Function to execute when task runs
     * @param {BackgroundTaskOptions} options - Options for the task
     * @returns {Promise<void>}
     */
    defineTask<T>(taskName: string, taskExecutor: (taskData?: T | undefined) => Promise<void>, options: BackgroundTaskOptions): Promise<void>;
    /**
     * @template T
     *
     * @param {string} taskName - The name of the task to start
     * @param {T} [parameters] - Optional parameters to pass to the task
     * @returns {Promise<void>}
     */
    startTask<T_1>(taskName: string, parameters?: T_1 | undefined): Promise<void>;
    /**
     * @private
     * @template T
     * @param {string} taskName
     * @param {(taskData?: T) => Promise<void>} executor
     * @param {T} [parameters]
     * @returns {() => Promise<void>}
     */
    private _generateTask;
    /**
     * Stops the specified background task.
     *
     * @param {string} taskName - The name of the task to stop
     * @returns {Promise<void>}
     */
    stopTask(taskName: string): Promise<void>;
    /**
     * Stops all running background tasks.
     *
     * @returns {Promise<void>}
     */
    stopAllTasks(): Promise<void>;
}
import EventEmitter from "eventemitter3";
