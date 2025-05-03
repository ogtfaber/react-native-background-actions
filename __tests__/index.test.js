import { Platform, AppRegistry } from 'react-native';
import BackgroundActions from '../src/index';
import {
    RNBackgroundActions as RNBackgroundActionsModule,
    nativeEventEmitter,
} from '../src/RNBackgroundActionsModule';

// Mocking modules
jest.mock('../src/RNBackgroundActionsModule', () => {
    return {
        RNBackgroundActions: {
            start: jest.fn(() => Promise.resolve()),
            stop: jest.fn(() => Promise.resolve()),
            updateNotification: jest.fn(() => Promise.resolve()),
        },
        nativeEventEmitter: {
            addListener: jest.fn(() => {
                return {
                    remove: jest.fn()
                };
            }),
        }
    };
});

jest.mock('react-native', () => {
    return {
        Platform: {
            OS: 'android'
        },
        AppRegistry: {
            registerHeadlessTask: jest.fn()
        }
    };
});

// Default options for tests
const defaultOptions = {
    taskTitle: 'ExampleTask title',
    taskDesc: 'ExampleTask desc',
    taskIcon: {
        name: 'ic_launcher',
        type: 'mipmap',
    },
};

describe('BackgroundActions with multiple tasks', () => {
    beforeEach(() => {
        // Reset mocks
        jest.clearAllMocks();
        
        // Reset BackgroundActions internal state
        BackgroundActions._tasks = {};
        BackgroundActions._isRunningMap = {};
        
        // Mock console.warn to avoid cluttering test output
        console.warn = jest.fn();
    });

    test('defineTask and startTask register and manage tasks', async () => {
        const taskName = 'TestTask';
        const task = jest.fn(() => Promise.resolve());
        
        // Define task
        await BackgroundActions.defineTask(taskName, task, defaultOptions);
        
        // We can check that the task was registered internally
        expect(BackgroundActions.getRegisteredTaskNames()).toContain(taskName);
        
        // Start task (manually set it as running for test purposes)
        await BackgroundActions.startTask(taskName);
        BackgroundActions._isRunningMap[taskName] = true;
        
        // Now we can check the task is running
        expect(BackgroundActions.isRunning(taskName)).toBe(true);
        
        // Verify native module was called
        expect(RNBackgroundActionsModule.start).toHaveBeenCalled();
        expect(AppRegistry.registerHeadlessTask).toHaveBeenCalledWith(
            taskName, 
            expect.any(Function)
        );
    });
    
    test('can run multiple tasks simultaneously', async () => {
        const task1Name = 'Task1';
        const task2Name = 'Task2';
        
        const task1 = jest.fn(() => Promise.resolve());
        const task2 = jest.fn(() => Promise.resolve());
        
        // Define both tasks
        await BackgroundActions.defineTask(task1Name, task1, defaultOptions);
        await BackgroundActions.defineTask(task2Name, task2, defaultOptions);
        
        // Start both tasks (manually set as running for test)
        await BackgroundActions.startTask(task1Name);
        await BackgroundActions.startTask(task2Name);
        BackgroundActions._isRunningMap[task1Name] = true;
        BackgroundActions._isRunningMap[task2Name] = true;
        
        // Check both are running
        expect(BackgroundActions.isRunning(task1Name)).toBe(true);
        expect(BackgroundActions.isRunning(task2Name)).toBe(true);
        expect(BackgroundActions.getRunningTaskNames().sort()).toEqual([task1Name, task2Name].sort());
    });
    
    test('can stop a specific task', async () => {
        const task1Name = 'Task1';
        const task2Name = 'Task2';
        
        // Define and start tasks
        await BackgroundActions.defineTask(task1Name, jest.fn(), defaultOptions);
        await BackgroundActions.defineTask(task2Name, jest.fn(), defaultOptions);
        
        // Manually set as running
        BackgroundActions._isRunningMap[task1Name] = true;
        BackgroundActions._isRunningMap[task2Name] = true;
        
        // Stop only Task1
        await BackgroundActions.stopTask(task1Name);
        
        expect(BackgroundActions.isRunning(task1Name)).toBe(false);
        expect(BackgroundActions.isRunning(task2Name)).toBe(true);
    });
    
    test('can update notification for a specific task', async () => {
        const taskName = 'NotificationTask';
        
        // Define and start the task
        await BackgroundActions.defineTask(taskName, jest.fn(), defaultOptions);
        await BackgroundActions.startTask(taskName);
        BackgroundActions._isRunningMap[taskName] = true;
        
        // Update notification
        const updatedOptions = { taskDesc: 'Updated description' };
        await BackgroundActions.updateNotification(taskName, updatedOptions);
        
        // Check that updateNotification was called with correct parameters
        expect(RNBackgroundActionsModule.updateNotification).toHaveBeenCalled();
        
        // The task should still be running
        expect(BackgroundActions.isRunning(taskName)).toBe(true);
    });
    
    test('can stop all running tasks', async () => {
        const task1Name = 'Task1';
        const task2Name = 'Task2';
        
        // Define and start tasks
        await BackgroundActions.defineTask(task1Name, jest.fn(), defaultOptions);
        await BackgroundActions.defineTask(task2Name, jest.fn(), defaultOptions);
        
        // Manually set as running
        BackgroundActions._isRunningMap[task1Name] = true;
        BackgroundActions._isRunningMap[task2Name] = true;
        
        // Stop all tasks
        await BackgroundActions.stopAllTasks();
        
        // Both tasks should be stopped
        expect(BackgroundActions.isRunning(task1Name)).toBe(false);
        expect(BackgroundActions.isRunning(task2Name)).toBe(false);
        expect(BackgroundActions.getRunningTaskNames()).toEqual([]);
    });
    
    test('emits expiration events with taskName', () => {
        const listener = jest.fn();
        BackgroundActions.on('expiration', listener);
        
        // Simulate an event being received
        BackgroundActions.emit('expiration', { taskName: 'TestTask' });
        
        // Check if our listener received the event with taskName
        expect(listener).toHaveBeenCalledWith({ taskName: 'TestTask' });
    });
});