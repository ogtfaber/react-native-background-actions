This package is designed to handoff background tasks that can finish running even if an app is moved to the background.

Currently, it only supports just one background task.

I would like to refactor this package to be able to start multiple tasks in parallel, each with their own name.

For inspiration, take a look at how Expo TaskManager is structured, you can define multiple tasks each with their own name.

Update the following
- the javascript file, which is the interface for including the package in a React Native project
- the ios native code to support starting multiple tasks each with their own name
- the Android native code to support starting multiple tasks each with their own name

After this, update the tests accordingly and validate that they are still running

And after this, update the Readme to the new way of defining and running tasks.
