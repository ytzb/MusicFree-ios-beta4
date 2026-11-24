#import <UIKit/UIKit.h>

NS_ASSUME_NONNULL_BEGIN

/**
 * iOS 27 SDK 强制要求 App 采用 UIScene 生命周期，否则启动即被系统杀掉
 * （UIApplicationEvaluateRuntimeIssueForNoSceneLifecycleAdoption / SIGTRAP）。
 *
 * React Native 0.76 的模板还在 AppDelegate 里直接创建 window，
 * 这里做一个最小迁移：SceneDelegate 接管已有的 window，把它挂到新的 windowScene 上，
 * 渲染逻辑仍然完全交给 RCTAppDelegate，避免改动 RN 内部行为。
 */
@interface SceneDelegate : UIResponder <UIWindowSceneDelegate>

@property (nonatomic, strong, nullable) UIWindow *window;

@end

NS_ASSUME_NONNULL_END
