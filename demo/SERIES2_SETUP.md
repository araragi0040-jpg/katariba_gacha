# 第2弾 demo 登録・確認手順

第2弾の通常フィギュア22体（N:13、R:6、SR:3）をHTMLとGASの初期マスターに登録済みです。名前・説明はファイル名由来、表示順はレア度順・同レア度内ファイル名順です。内部IDは201〜222です。EX画像は未提供のため未登録です。

1. 第2弾画像を demo/images/第2弾/ に配置します。
2. 第2弾はGASの初期マスターから取得するため、シートへの手動追加は不要です。gacha_figure_master に同じIDの行がある場合はその値が優先されます。調整する場合の項目は以下です。
   - figureId: 第1弾（1〜40）と重複しない正の整数。例: 201以降。
   - seriesId: S2
   - displayNo: No.1 などの表示番号
   - sortOrder: 弾内の表示順
   - figureName / rarity / concept: 名前、N・R・SR・EX、説明
   - image: images/第2弾/ファイル名.png
   - dropRate: 抽選の相対的な重み（確率そのものではありません）。EXは0。
   - exchangeCost: N=10、R=20、SR=30、EX=50
   - isEx: EXのみTRUE
   - isDrawTarget: 通常はTRUE、EXはFALSE
   - isActive: TRUE
3. demo用のGASに demo/Code.gs を反映して既存デプロイを更新します。接続URLは維持します。
4. demo/index.html と画像をdemo環境へ反映します。
5. demoの有効なチケットで開き、各弾の抽選・残高・通常交換・EX合算交換・再読込を確認します。

交換履歴には pointAllocationJson 列が自動追加されます。EXは対象の弾の通常フィギュアをコンプリートしてから交換でき、各弾から使用するptの内訳を確認画面で指定します。

ローカル検証: node demo/tests/series.test.cjs

メインへの反映はdemoでの動作確認後に行います。本番へdemoの所持情報や残高をコピーしません。
