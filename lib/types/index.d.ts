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

declare const backgroundServer: BackgroundServer;

declare class BackgroundServer extends EventEmitter<"expiration", { taskName: string }> {
    /** @private */
    private _tasks;
    /** @private */
    private _isRunningMap;
    
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
     * It returns `true` if `start()` has been called and the task has not finished.
     *
     * It returns `false` if `stop()` has been called, **even if the task has not finished**.
     * 
     * @param {string} taskName - The name of the task to check
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
     * @param {BackgroundTaskOptions & {parameters?: T}} options
     * @returns {Promise<void>}
     */
    defineTask<T>(taskName: string, taskExecutor: (taskData?: T) => Promise<void>, options: BackgroundTaskOptions & { parameters?: T }): Promise<void>;
    
    /**
     * @template T
     *
     * @param {string} taskName - The name of the task to start
     * @param {T} [parameters] - Optional parameters to pass to the task
     * @returns {Promise<void>}
     */
    startTask<T>(taskName: string, parameters?: T): Promise<void>;
    
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
    
    // Backward compatibility methods
    
    /**
     * @template T
     *
     * @param {(taskData?: T) => Promise<void>} task
     * @param {BackgroundTaskOptions & {parameters?: T}} options
     * @returns {Promise<void>}
     * @deprecated Use defineTask and startTask instead
     */
    start<T>(task: (taskData?: T) => Promise<void>, options: BackgroundTaskOptions & { taskName: string; parameters?: T }): Promise<void>;
    
    /**
     * Updates the notification for the legacy single task.
     *
     * @param {{taskTitle?: string,
     *        taskDesc?: string,
     *        taskIcon?: {name: string, type: string, package?: string},
     *        color?: string,
     *        linkingURI?: string,
     *        progressBar?: {max: number, value: number, indeterminate?: boolean}}} taskData
     * @returns {Promise<void>}
     * @deprecated Use updateNotification(taskName, taskData) instead
     */
    updateNotificationLegacy(taskData: {
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
     * Checks if any task is running for backward compatibility.
     *
     * @returns {boolean}
     * @deprecated Use isRunning(taskName) instead
     */
    isRunningLegacy(): boolean;
    
    /**
     * Stops all tasks for backward compatibility.
     *
     * @returns {Promise<void>}
     * @deprecated Use stopTask(taskName) instead
     */
    stop(): Promise<void>;
}

import EventEmitter from "eventemitter3";