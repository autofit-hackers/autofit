# autofit
![](/assets/autofit_logo.png)

## Prerequisite
### [dvc](https://dvc.org/doc/start)
* サイズの大きなファイル、非ソースコードのバージョン管理・共有に利用
  * [cheatsheet](https://www.globalsqa.com/dvc-cheat-sheet/)

#### how to use dvc
```
$ dvc pull
$ dvc add streamlit_example/data
$ git commit -m 'hoge'
$ dvc push
```


## 開発規約
### Coding

### Commit message rules
#### Prefix
* feat: 新規機能の追加
* fix: バグの修正
* change: 仕様変更による機能修正
* disable: 機能の無効化
* docs: ドキュメントのみの変更
* rename: ファイル・ディレクトリの改名
* move: ファイル・ディレクトリの移動
* style: 空白、フォーマット、セミコロン追加など
* refactor: 仕様に影響がないコード改善(リファクタ)
* perf: パフォーマンス向上関連
* test: テスト関連
* chore: ビルド、補助ツール、ライブラリ関連
* data: データの追加

### Branch name rules
* ブランチ名
  * `<prefix>/<issue-name>` の命名規則で切る
    * 例: `refactor/use-numpy-to-deal-with-mediapipe-result`
* コミットメッセージ
  * `<type>: <commit-message> (#<issue_id>)`
    * 例: `refactor: hogehoge (#27)`
    * 対応する issue が存在しない場合は、 `issue_id` はなくてもよい
* **実機（両国）環境での動作が確認されたもののみ、 `stable` ブランチにマージする**
* 詳細は [contributing.md](/.github/contributing.md)を参照すると良い


## Project management

