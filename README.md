# posefit

## Requirements
* Unity: 2020.3.23f1

## 環境構築
GitHub で管理することが難しい容量が大きいファイル（wav, mp4 など）は Google Drive にて管理されている。  
スクリプト実行前に追加すること。
* https://drive.google.com/drive/folders/1OMLF-E_3EfgNiBIXiqC2FCJagt32RkFf?usp=sharing
ただし、 `*.meta` ファイルは Git に追加して管理する必要があるため、注意すること。

## コーディング規約
### C#
[C# Coding Conventions](https://docs.microsoft.com/en-us/dotnet/csharp/fundamentals/coding-style/coding-conventions)

## Commit Message Rules
* feat: A new feature
* fix: A bug fix
* docs: Documentation only changes 
* style: Changes that do not affect the meaning of the code (white-space, formatting, missing semi-colons, etc)
* refactor: A code change that neither fixes a bug nor adds a feature
* perf: A code change that improves performance
* test: Adding missing or correcting existing tests
* chore: Changes to the build process or auxiliary tools and libraries such as documentation generation

## Git管理規則
* ブランチ名
  * `<type>/<issue_id>/<issue-name>` の命名規則で切る
    * 例: `refactor/27/use-numpy-to-deal-with-mediapipe-result`
* コミットメッセージ
  * `<type>: <commit-message> #<issue_id>`
    * 例: `refactor: hogehoge #27`
