@import UIKit;
#import "RNBackgroundActions.h"

@implementation RNBackgroundActions {
    NSMutableDictionary *bgTasks;
}

RCT_EXPORT_MODULE()
- (NSArray<NSString *> *)supportedEvents
{
    return @[@"expiration"];
}

- (instancetype)init
{
    self = [super init];
    if (self) {
        bgTasks = [NSMutableDictionary dictionary];
    }
    return self;
}

- (void)_startTask:(NSString *)taskName
{
    [self _stopTask:taskName];
    UIBackgroundTaskIdentifier taskId = [[UIApplication sharedApplication] beginBackgroundTaskWithName:taskName expirationHandler:^{
        [self onExpirationForTask:taskName];
        [[UIApplication sharedApplication] endBackgroundTask:self->bgTasks[taskName].intValue];
        [self->bgTasks removeObjectForKey:taskName];
    }];
    
    // Store task ID in the dictionary with task name as key
    bgTasks[taskName] = @(taskId);
}

- (void)_stopTask:(NSString *)taskName
{
    NSNumber *taskIdObj = bgTasks[taskName];
    if (taskIdObj != nil) {
        UIBackgroundTaskIdentifier taskId = taskIdObj.intValue;
        if (taskId != UIBackgroundTaskInvalid) {
            [[UIApplication sharedApplication] endBackgroundTask:taskId];
            [bgTasks removeObjectForKey:taskName];
        }
    }
}

- (void)onExpirationForTask:(NSString *)taskName
{
    [self sendEventWithName:@"expiration"
                       body:@{@"taskName": taskName}];
}

RCT_EXPORT_METHOD(start:(NSDictionary *)options
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
    NSString *taskName = options[@"taskName"];
    if (!taskName) {
        reject(@"task_name_required", @"Task name is required", nil);
        return;
    }
    
    [self _startTask:taskName];
    resolve(nil);
}

RCT_EXPORT_METHOD(stop:(NSString *)taskName
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
    if (!taskName) {
        reject(@"task_name_required", @"Task name is required", nil);
        return;
    }
    
    [self _stopTask:taskName];
    resolve(nil);
}

@end