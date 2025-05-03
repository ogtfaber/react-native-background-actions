import { Platform, AppRegistry } from 'react-native';
import BackgroundActions from '../src/index';
import {
    RNBackgroundActions as RNBackgroundActionsModule,
    nativeEventEmitter,
} from '../src/RNBackgroundActionsModule';

// @ts-ignore
const mockedEventEmitter = /** @type {{ addListener: jest.Mock<any, any> }} */ (nativeEventEmitter);

// Flush promises
const flushPromises = () => new Promise(setImmediate);

Platform.OS = 'android';

// @ts-ignore
AppRegistry.registerHeadlessTask = jest.fn(async (taskName, task) => task()());

const defaultOptions = {
    taskTitle: 'ExampleTask title',
    taskDesc: 'ExampleTask desc',
    taskIcon: {
        name: 'ic_launcher',
        type: 'mipmap',
    },
    parameters: {
        delay: 1000,
    },
};

// Test suite for new multiple task API
describe('Multiple Tasks API', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('defineTask and startTask', async () => {
        let promiseFinish = () => {};
        const defaultTask = jest.fn(
            // @ts-ignore
            async () => await new Promise((resolve) => (promiseFinish = resolve))
        );

        const taskName = 'ExampleTask1';

        // Define task
        await BackgroundActions.defineTask(taskName, defaultTask, defaultOptions);
        
        // Start task
        await BackgroundActions.startTask(taskName, defaultOptions.parameters);
        
        expect(defaultTask).toHaveBeenCalledTimes(1);
        expect(defaultTask).toHaveBeenCalledWith(defaultOptions.parameters);
        expect(AppRegistry.registerHeadlessTask).toHaveBeenCalledTimes(1);
        expect(AppRegistry.registerHeadlessTask).toHaveBeenCalledWith(taskName, expect.any(Function));
        expect(RNBackgroundActionsModule.start).toHaveBeenCalledTimes(1);
        expect(BackgroundActions.isRunning(taskName)).toBe(true);
        
        promiseFinish();
        await flushPromises();
        expect(BackgroundActions.isRunning(taskName)).toBe(false);
    });

    test('define and run multiple tasks simultaneously', async () => {
        let finishTask1 = () => {};
        let finishTask2 = () => {};
        
        const task1 = jest.fn(
            // @ts-ignore
            async () => await new Promise((resolve) => (finishTask1 = resolve))
        );
        
        const task2 = jest.fn(
            // @ts-ignore
            async () => await new Promise((resolve) => (finishTask2 = resolve))
        );

        const task1Name = 'Task1';
        const task2Name = 'Task2';
        
        // Define and start both tasks
        await BackgroundActions.defineTask(task1Name, task1, { ...defaultOptions });
        await BackgroundActions.defineTask(task2Name, task2, { ...defaultOptions });
        
        await BackgroundActions.startTask(task1Name, { task: 1 });
        await BackgroundActions.startTask(task2Name, { task: 2 });
        
        // Check both tasks running
        expect(BackgroundActions.isRunning(task1Name)).toBe(true);
        expect(BackgroundActions.isRunning(task2Name)).toBe(true);
        expect(BackgroundActions.getRunningTaskNames()).toEqual([task1Name, task2Name]);
        
        // Check parameters passed correctly
        expect(task1).toHaveBeenCalledWith({ task: 1 });
        expect(task2).toHaveBeenCalledWith({ task: 2 });
        
        // Stop one task
        await BackgroundActions.stopTask(task1Name);
        expect(BackgroundActions.isRunning(task1Name)).toBe(false);
        expect(BackgroundActions.isRunning(task2Name)).toBe(true);
        
        // Clean up
        finishTask1();
        finishTask2();
        await flushPromises();
        await BackgroundActions.stopAllTasks();
    });

    test('updateNotification with specific task', async () => {
        let promiseFinish = () => {};
        const defaultTask = jest.fn(
            // @ts-ignore
            async () => await new Promise((resolve) => (promiseFinish = resolve))
        );

        const taskName = 'NotificationTask';
        
        await BackgroundActions.defineTask(taskName, defaultTask, defaultOptions);
        await BackgroundActions.startTask(taskName);
        
        RNBackgroundActionsModule.updateNotification.mockClear();
        
        const updatedOptions = { taskDesc: 'New Desc' };
        await BackgroundActions.updateNotification(taskName, updatedOptions);
        
        expect(RNBackgroundActionsModule.updateNotification).toHaveBeenCalledTimes(1);
        expect(RNBackgroundActionsModule.updateNotification.mock.calls[0][0].taskDesc).toBe(updatedOptions.taskDesc);
        expect(RNBackgroundActionsModule.updateNotification.mock.calls[0][0].taskName).toBe(taskName);
        
        promiseFinish();
        await flushPromises();
    });

    test('backward compatibility using deprecated API', async () => {
        let promiseFinish = () => {};
        const defaultTask = jest.fn(
            // @ts-ignore
            async () => await new Promise((resolve) => (promiseFinish = resolve))
        );
        
        // Clear console warnings
        console.warn = jest.fn();
        
        // Test backward compatibility with old start API
        await BackgroundActions.start(defaultTask, {
            ...defaultOptions,
            taskName: 'LegacyTask',
        });
        
        expect(console.warn).toHaveBeenCalled();
        expect(BackgroundActions.isRunning('LegacyTask')).toBe(true);
        
        // Test backward compatibility with old stop API
        await BackgroundActions.stop();
        expect(BackgroundActions.isRunning('LegacyTask')).toBe(false);
        
        promiseFinish();
        await flushPromises();
    });

    test('expiration event includes taskName', () => {
        Platform.OS = 'ios';
        return new Promise((done) => {
            BackgroundActions.on('expiration', (data) => {
                expect(data).toHaveProperty('taskName');
                done();
            });
            
            // Mock with taskName for the event
            mockedEventEmitter.addListener.mock.calls[0][1]({ taskName: 'ExpiringTask' });
        });
    });
});

// Legacy tests for backward compatibility
describe('Legacy API', () => {
    test('stop-empty', async () => {
        expect(BackgroundActions.isRunningLegacy()).toBe(false);
        RNBackgroundActionsModule.stop.mockClear();
        await BackgroundActions.stop();
        expect(RNBackgroundActionsModule.stop).toHaveBeenCalledTimes(1);
        expect(BackgroundActions.isRunningLegacy()).toBe(false);
    });

    test('start-android', async () => {
        let promiseFinish = () => {};
        const defaultTask = jest.fn(
            // @ts-ignore
            async () => await new Promise((resolve) => (promiseFinish = resolve))
        );
        Platform.OS = 'android';
        // @ts-ignore
        AppRegistry.registerHeadlessTask.mockClear();
        RNBackgroundActionsModule.start.mockClear();
        
        const options = {
            ...defaultOptions,
            taskName: 'LegacyAndroidTask',
        };
        
        await BackgroundActions.start(defaultTask, options);
        expect(defaultTask).toHaveBeenCalledTimes(1);
        expect(defaultTask).toHaveBeenCalledWith(options.parameters);
        expect(AppRegistry.registerHeadlessTask).toHaveBeenCalledTimes(1);
        expect(RNBackgroundActionsModule.start).toHaveBeenCalledTimes(1);
        expect(BackgroundActions.isRunning('LegacyAndroidTask')).toBe(true);
        promiseFinish();
        await flushPromises();
        expect(BackgroundActions.isRunning('LegacyAndroidTask')).toBe(false);
    });

    test('start-ios', async () => {
        let promiseFinish = () => {};
        const defaultTask = jest.fn(
            // @ts-ignore
            async () => await new Promise((resolve) => (promiseFinish = resolve))
        );
        // @ts-ignore
        AppRegistry.registerHeadlessTask.mockClear();
        Platform.OS = 'ios';
        RNBackgroundActionsModule.start.mockClear();
        
        const options = {
            ...defaultOptions,
            taskName: 'LegacyIOSTask',
        };
        
        await BackgroundActions.start(defaultTask, options);
        expect(defaultTask).toHaveBeenCalledTimes(1);
        expect(defaultTask).toHaveBeenCalledWith(options.parameters);
        expect(AppRegistry.registerHeadlessTask).toHaveBeenCalledTimes(0);
        expect(RNBackgroundActionsModule.start).toHaveBeenCalledTimes(1);
        expect(BackgroundActions.isRunning('LegacyIOSTask')).toBe(true);
        promiseFinish();
        await flushPromises();
        expect(BackgroundActions.isRunning('LegacyIOSTask')).toBe(false);
    });

    test('stop legacy', async () => {
        let promiseFinish = () => {};
        const defaultTask = jest.fn(
            // @ts-ignore
            async () => await new Promise((resolve) => (promiseFinish = resolve))
        );
        
        const options = {
            ...defaultOptions,
            taskName: 'StopTestTask',
        };
        
        await BackgroundActions.start(defaultTask, options);
        RNBackgroundActionsModule.stop.mockClear();
        await BackgroundActions.stop();
        expect(RNBackgroundActionsModule.stop).toHaveBeenCalledTimes(1);
        expect(BackgroundActions.isRunning('StopTestTask')).toBe(false);
        promiseFinish(); // Clear the promise
    });
});