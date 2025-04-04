# Contribution Guide

活動するにあたり、コミットの精度が人によってまちまちになるのを防ぐための指針です。

## ドキュメントの修正

Issueの追加は任意です。

- 手順書
  - GitHub Wikiに記載します。
- 要件・仕様
  - GitHub Wikiに記載します。
  - グループ外のスタッフと共有する場合は必要に応じてConfluence上に転記します。
- 議事録
  - SmartMeetingに記載します。

## コードの修正

以下のフロー通過を原則とします。Issue作成時の各入力項目を満たせない場合は、先ずはマイルストーンにてCard化を検討してください。

1. Issueの作成
1. PullRequestの作成
1. Review後のmerge

### GitHub Actions Workflowの修正

GitHub Actions Workflowはデフォルトブランチに登録されているworkflowを実行できます。workflowの動作確認をする場合、更新の仕方によって手順が異なります。

#### 新しいworkflowを追加する場合

新しくworkflowを追加する場合は、一時的にデフォルトブランチの切り替えが必要です。その際、デフォルトブランチの戻し忘れなどの事故を防ぐため、 Slackで変更連絡しましょう。

#### 既存のworkflowを更新する場合

既存のworkflowを更新する場合はデフォルトブランチの切り替えは不要です。対象のブランチを指定してworkflowを実行しましょう。

## Issueの作成

- 先ずは同等のIssueが既に存在するか確認します。
- 1つのIssueに複数の要素を入れると作業期間が長期化します。関連する要素であれば、大枠としてマイルストーンの作成を検討してください。

### Issueの運用

- 着手したIssueに担当者を割り当てておきます。
- ToDo追記はチェックリストにて見落とし防止で追記日付込で本文に記載しておきます。
- 別の問題が発生した場合は、内容と背景、当該Issue内で解決可能か見込みを立てて記載しておきます。

## Pull-Requestの作成

- 先にIssue作成を完了しておきます。
- 作業ブランチ名をタイトルにしたまま作成はしないでください。
- 動作確認完了前はDraftにします。
- Review時の可読性をあげるため、誤字脱字修正のcommitは極力rebaseでsquashかfixupをしておきます。
- mergeと同時にcloseさせたいIssueがある場合は、忘れずに`fix #<Issue Index>`と記載します。

### Pull-Requestの運用

- コード変更目的のスニペットは、経緯や可読性を重視して極力IssueではなくPullRequest側に追記してください。
- 変更内容や動作確認項目の追加は見落としを防ぐために必ず本文修正にて行ってください。
- コード変更の根拠として状況調査や検証を掲載する場合、長文となりやすいためIssue側に追記した上でPullRequest側へコメントリンクの形で行います。
- masterブランチでmerge発生時は、作業ブランチ側で逐次 `git pull --rebase origin master` を行ってください。差分が多くなりReview時の負担が増えます。

## Review

### レビュー前にやること

- 開発環境でCI/CD・動作確認を完了させます。
- PRのスコープが適切か再確認します。
  - 機能追加と同時に大幅なリファクタリングを行うと変更量が多くなります。機能追加・リファクタリングそれぞれで分割PRによる対応を検討してください。

### レビュー後にやること

- Squash and Merge でマージします。
- 作業ブランチを削除します。

## 参考文献
* [チーム内でなんとなくやっていたIssueやPR作成についてガイドライン化してCONTRIBUTING.mdに書き起こしてみた
](https://dev.classmethod.jp/articles/output-contributing-md-for-team-building/)
