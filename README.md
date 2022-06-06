# posefit
![](/assets/posefit_logo.png)

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

### Pyaudio: 音声認識ライブラリ
```
$ brew install portaudio
$ conda install -c anaconda portaudio
$ python3 -m pip install pyaudio --global-option="build_ext" --global-option="-I/opt/homebrew/include" --global-option="-L/opt/homebrew/lib"
```

## 開発規約
### Coding
* [Python: pep8](https://pep8-ja.readthedocs.io/ja/latest/)

### Commit message rules
#### Prefix
* feat: A new feature
* fix: A bug fix
* docs: Documentation only changes
* style: Changes that do not affect the meaning of the code (white-space, formatting, missing semi-colons, etc)
* refactor: A code change that neither fixes a bug nor adds a feature
* perf: A code change that improves performance
* test: Adding missing or correcting existing tests
* chore: Changes to the build process or auxiliary tools and libraries such as documentation generation

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
* [Jira](https://www.atlassian.com/software/jira)
  * ブランチを切るときは jira のチケットから切りましょう
