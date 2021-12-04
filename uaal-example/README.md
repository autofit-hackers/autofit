
# Unity as a Library integration example to iOS and Android #
## 参考
* [公式ドキュメント](https://docs.unity3d.com/2020.3/Documentation/Manual/UnityasaLibrary.html)
* [元レポジトリ](https://github.com/hrkd/uaal-example)
  * 公式のサンプルプロジェクトはObjective-Cで書かれているため、Swiftで書き直されている本レポジトリを利用する。

## 使用方法
* `UnityProject/Assets/Plugins` をUaaLとして利用したいプロジェクトの `Assets`配下にコピーする
* UnityでiOSのビルドをする -> `iOSbuild`
* 新しいXcode projectを作成し、`nativeOSApp.xcodeproj` と　`iOSbuild/Unity-iPhone.xcodeproj` を追加する
* Xcodeのメニューバーから
  * `nativeOSApp` を選択し、Generalタブ -> Frameworks, Libraries, and Embedded Content から `UnityFramework.framework` を追加
  * `Unity-iPhone/Libraries/Plugins/iOS/NativeCallProxy.h` を選択し、Target Membership から UnityFramework にチェックを入れて Private -> Public に変更
  * `Unity-iPhone/Data` を選択し、Target Membership のチェックを Unity-iPhone から UnityFrameworkに変更する
  * `Unity-iPhone/MainApp/main.mm` のメイン関数内に `[ufw setDataBundleID:"com.unity3d.framework];`を追記
  * ```id = ufw = UnityFrameworkLoad();
[ufw setDataBundleId:"com.unity3d.framework"];
[ufw runUIApplicationMainWithArgc: argc argv: argv];
```
* Xcode project をビルドする

In some scenario developers using native platform technologies (like Android/Java & iOS/Objective C) want to include in their apps/games features powered by Unity for 3D/2D Real Time Rendering, AR experience, interaction with 3D models, 2D mini games and more.

Starting with Unity 2019.3.0a2, Unity  introduced a new feature to use Unity as a library in native apps by integrating the Unity runtime components and content in a native platform project. The Unity Runtime Library exposes controls to manage when and how to load/activate/unload within the native application.

**Warning**

Using Unity as a Library **requires you have experience with developing for native platform technologies** such as Java/Android, Objective C/iOS, or Windows Win32/UWP. You need to be familiar with the structure of the project, language features and specific platform configuration options (like user permissions for example).


**Limitations**

While we tested many scenarios for Unity as a library hosted by a native app, Unity does not control anymore the lifecycle of the runtime, so we cannot guarantee it'll work in all possible use cases. 
For example:
- Unity as a Library supports rendering only full screen, rendering on a part of the screen isn’t supported.
- Loading more than one instance of the Unity runtime isn’t supported.
- You may need to adapt 3rd party Plug-ins (native or managed) to work properly  
- Overhead of having Unity in unloaded state is: 90Mb for Android and 110Mb for iOS

**How it works**

The build process overall is still the same, Unity creates the iOS Xcode and Android Gradle projects and generated iOS Xcode and Android Gradle projects have the following structure:
 A library part (iOS framework and Android Archive (AAR) file) that includes all source & plugins 
 A thin launcher part that includes app representation data and runs library

Step by step explanations on how to include the [iOS](docs/ios.md) / [Android](docs/android.md) library part into your native application when needed.

