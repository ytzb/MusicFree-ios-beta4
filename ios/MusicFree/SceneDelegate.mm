#import "SceneDelegate.h"
#import "AppDelegate.h"

#import <React/RCTLinkingManager.h>

@implementation SceneDelegate

- (void)scene:(UIScene *)scene
    willConnectToSession:(UISceneSession *)session
                 options:(UISceneConnectionOptions *)connectionOptions
{
  if (![scene isKindOfClass:[UIWindowScene class]]) {
    return;
  }
  UIWindowScene *windowScene = (UIWindowScene *)scene;

  // RCTAppDelegate 已经在 didFinishLaunching 里建好了 window（及 rootViewController），
  // 这里只需要把它挂到当前 scene 上，避免重复创建 bridge。
  UIWindow *mainWindow = nil;
  id<UIApplicationDelegate> appDelegate = UIApplication.sharedApplication.delegate;
  if ([appDelegate isKindOfClass:[AppDelegate class]]) {
    mainWindow = ((AppDelegate *)appDelegate).window;
  }

  if (mainWindow) {
    mainWindow.windowScene = windowScene;
    [mainWindow makeKeyAndVisible];
    self.window = mainWindow;
  } else {
    // 兜底：万一 RCTAppDelegate 没建 window，则手动建一个空的，至少不会崩
    UIWindow *fallback = [[UIWindow alloc] initWithWindowScene:windowScene];
    fallback.rootViewController = [UIViewController new];
    [fallback makeKeyAndVisible];
    self.window = fallback;
  }

  // 冷启动时通过 URL 唤起 App 的情况
  NSURL *coldStartURL = connectionOptions.URLContexts.anyObject.URL;
  if (coldStartURL) {
    [self openURL:coldStartURL];
  }
  for (NSUserActivity *activity in connectionOptions.userActivities) {
    [self continueUserActivity:activity];
  }
}

#pragma mark - 深链转发（迁移到 scene 后 AppDelegate 的回调不再触发）

- (void)scene:(UIScene *)scene openURLContexts:(NSSet<UIOpenURLContext *> *)URLContexts
{
  for (UIOpenURLContext *context in URLContexts) {
    [self openURL:context.URL];
  }
}

- (void)scene:(UIScene *)scene continueUserActivity:(NSUserActivity *)userActivity
{
  [self continueUserActivity:userActivity];
}

- (void)openURL:(NSURL *)url
{
  if (!url) {
    return;
  }
  [RCTLinkingManager application:UIApplication.sharedApplication
                        openURL:url
                        options:@{}];
}

- (void)continueUserActivity:(NSUserActivity *)userActivity
{
  if (!userActivity) {
    return;
  }
  [RCTLinkingManager application:UIApplication.sharedApplication
          continueUserActivity:userActivity
            restorationHandler:^(NSArray<id<UIUserActivityRestoring>> *restorableObjects){
            }];
}

@end
