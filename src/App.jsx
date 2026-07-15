import React, { useEffect, useMemo, useState } from "react";

/* ============================================================
   かんたん簿記 初級 - App.jsx(1ファイル完結版)
   教材用にできるだけ1ファイルへ集約しています。
   仕訳問題30問・勘定科目辞典(逆引き対応)・進捗のlocalStorage保存
   を含む、このファイル1本で動くReactアプリです。
   周辺のindex.html / package.json / vite.config.js などは
   ほぼ固定の雛形なので、通常はこのApp.jsxだけを更新すればOK。
   ============================================================ */

/* ---------------- 勘定科目辞典データ ---------------- */
const CATEGORIES = ["資産", "負債", "純資産", "収益", "費用"];
const CATEGORY_STYLE = {
  資産: "bg-blue-50 text-blue-800 border-blue-300",
  負債: "bg-amber-50 text-amber-800 border-amber-300",
  純資産: "bg-emerald-50 text-emerald-800 border-emerald-300",
  収益: "bg-sky-50 text-sky-800 border-sky-300",
  費用: "bg-rose-50 text-rose-800 border-rose-300",
};

const rawAccounts = [
  { name: "現金", yomi: "げんきん", category: "資産", normalSide: "debit", description: "硬貨や紙幣のほか、他人振出の小切手や送金小切手など、金融機関ですぐに現金化できる通貨代用証券も含む勘定。" },
  { name: "当座預金", yomi: "とうざよきん", category: "資産", normalSide: "debit", description: "銀行と当座取引契約を結び、小切手や手形の決済のために預け入れる無利息の預金。" },
  { name: "普通預金", yomi: "ふつうよきん", category: "資産", normalSide: "debit", description: "いつでも自由に預け入れ・引き出しができる、利息の付く一般的な銀行預金。" },
  { name: "小口現金", yomi: "こぐちげんきん", category: "資産", normalSide: "debit", description: "少額の日常的な支払いに備え、用度係へあらかじめ前渡ししておく現金。" },
  { name: "受取手形", yomi: "うけとりてがた", category: "資産", normalSide: "debit", description: "商品代金の決済などで受け取った約束手形・為替手形上の権利。" },
  { name: "売掛金", yomi: "うりかけきん", category: "資産", normalSide: "debit", description: "商品や製品を掛け(信用取引)で販売したときに生じる、後日代金を受け取る権利。" },
  { name: "繰越商品", yomi: "くりこししょうひん", category: "資産", normalSide: "debit", description: "決算日にまだ販売されずに残っている商品(期末商品棚卸高)を表す勘定。" },
  { name: "貸付金", yomi: "かしつけきん", category: "資産", normalSide: "debit", description: "他人に金銭を貸し付けたときに生じる、後日返済を受ける権利。" },
  { name: "未収入金", yomi: "みしゅうにゅうきん", category: "資産", normalSide: "debit", description: "商品売買以外の取引から生じた、まだ回収していない代金を受け取る権利。" },
  { name: "前払金", yomi: "まえばらいきん", category: "資産", normalSide: "debit", description: "商品の仕入れなどに先立ち代金の一部を支払ったときに生じる、商品を受け取る権利。" },
  { name: "立替金", yomi: "たてかえきん", category: "資産", normalSide: "debit", description: "取引先や従業員が負担すべき金額を一時的に立て替えて支払ったときに生じる債権。" },
  { name: "仮払金", yomi: "かりばらいきん", category: "資産", normalSide: "debit", description: "支出の内容や金額がまだ確定していないときに一時的に用いる勘定。" },
  { name: "建物", yomi: "たてもの", category: "資産", normalSide: "debit", description: "事務所、店舗、倉庫など事業のために所有する建造物。減価償却の対象。" },
  { name: "備品", yomi: "びひん", category: "資産", normalSide: "debit", description: "パソコンや机など、耐用年数1年以上の事務用品・什器。減価償却の対象。" },
  { name: "車両運搬具", yomi: "しゃりょううんぱんぐ", category: "資産", normalSide: "debit", description: "営業用の自動車やトラックなど。減価償却の対象。" },
  { name: "土地", yomi: "とち", category: "資産", normalSide: "debit", description: "事業用に所有する敷地。減価償却は行わない。" },
  { name: "貸倒引当金", yomi: "かしだおれひきあてきん", category: "資産", normalSide: "credit", contra: true, description: "債権が将来回収できなくなる事態に備えて見積もっておく金額。資産のマイナス項目。" },
  { name: "支払手形", yomi: "しはらいてがた", category: "負債", normalSide: "credit", description: "仕入代金の決済などのために自ら振り出した約束手形上の義務。" },
  { name: "買掛金", yomi: "かいかけきん", category: "負債", normalSide: "credit", description: "商品を掛けで仕入れたときに生じる、後日代金を支払う義務。" },
  { name: "借入金", yomi: "かりいれきん", category: "負債", normalSide: "credit", description: "銀行などから金銭を借り入れたときに生じる返済義務。" },
  { name: "未払金", yomi: "みばらいきん", category: "負債", normalSide: "credit", description: "商品売買以外の取引から生じた、まだ支払っていない代金を支払う義務。" },
  { name: "前受金", yomi: "まえうけきん", category: "負債", normalSide: "credit", description: "商品の受注に際し、代金の一部をあらかじめ受け取ったときに生じる義務。" },
  { name: "預り金", yomi: "あずかりきん", category: "負債", normalSide: "credit", description: "給料から差し引く源泉所得税や社会保険料など、一時的に預かっている金額。" },
  { name: "仮受金", yomi: "かりうけきん", category: "負債", normalSide: "credit", description: "内容や金額が確定していない入金を一時的に処理しておく勘定。" },
  { name: "未払費用", yomi: "みばらいひよう", category: "負債", normalSide: "credit", description: "決算日までにサービスの提供を受けているが、まだ支払っていない費用の見越し計上。" },
  { name: "前受収益", yomi: "まえうけしゅうえき", category: "負債", normalSide: "credit", description: "決算日時点でまだ提供していないサービスの対価を、すでに受け取っている収益の繰延べ。" },
  { name: "資本金", yomi: "しほんきん", category: "純資産", normalSide: "credit", description: "事業主や株主が事業の元手として出資した金額。" },
  { name: "引出金", yomi: "ひきだしきん", category: "純資産", normalSide: "debit", contra: true, description: "個人事業主が事業のお金や商品を私的に使ったときの、資本金の減少を表す勘定。" },
  { name: "売上", yomi: "うりあげ", category: "収益", normalSide: "credit", description: "商品や製品を販売することによって得た代金。" },
  { name: "受取手数料", yomi: "うけとりてすうりょう", category: "収益", normalSide: "credit", description: "仲介や取次ぎなどのサービス提供によって受け取った手数料。" },
  { name: "受取利息", yomi: "うけとりりそく", category: "収益", normalSide: "credit", description: "貸付金や預金などから生じた利息を受け取ったときの収益。" },
  { name: "受取家賃", yomi: "うけとりやちん", category: "収益", normalSide: "credit", description: "建物などを貸し付けたことにより受け取る賃料。" },
  { name: "受取地代", yomi: "うけとりちだい", category: "収益", normalSide: "credit", description: "土地を貸し付けたことにより受け取る賃料。" },
  { name: "固定資産売却益", yomi: "こていしさんばいきゃくえき", category: "収益", normalSide: "credit", description: "固定資産を帳簿価額より高く売却したときに生じる差額(利益)。" },
  { name: "雑益", yomi: "ざつえき", category: "収益", normalSide: "credit", description: "金額的に重要性が低く他の科目に当てはまらない臨時の収益。" },
  { name: "仕入", yomi: "しいれ", category: "費用", normalSide: "debit", description: "販売する目的で商品を購入したときの原価。" },
  { name: "給料", yomi: "きゅうりょう", category: "費用", normalSide: "debit", description: "従業員に対して支払う労働の対価(総支給額)。" },
  { name: "法定福利費", yomi: "ほうていふくりひ", category: "費用", normalSide: "debit", description: "社会保険料のうち会社が負担する部分の費用。" },
  { name: "広告宣伝費", yomi: "こうこくせんでんひ", category: "費用", normalSide: "debit", description: "商品やサービスの宣伝のために支出した費用。" },
  { name: "支払手数料", yomi: "しはらいてすうりょう", category: "費用", normalSide: "debit", description: "銀行の振込手数料など、サービス利用に対して支払う手数料。" },
  { name: "支払利息", yomi: "しはらいりそく", category: "費用", normalSide: "debit", description: "借入金などに対して支払う利息。" },
  { name: "支払家賃", yomi: "しはらいやちん", category: "費用", normalSide: "debit", description: "建物などを借りていることにより支払う賃料。" },
  { name: "支払地代", yomi: "しはらいちだい", category: "費用", normalSide: "debit", description: "土地を借りていることにより支払う賃料。" },
  { name: "通信費", yomi: "つうしんひ", category: "費用", normalSide: "debit", description: "電話代、切手代、インターネット利用料金など通信のためにかかる費用。" },
  { name: "水道光熱費", yomi: "すいどうこうねつひ", category: "費用", normalSide: "debit", description: "電気・ガス・水道の使用料金。" },
  { name: "旅費交通費", yomi: "りょひこうつうひ", category: "費用", normalSide: "debit", description: "出張旅費や電車・バス代など、業務上の移動にかかる費用。" },
  { name: "消耗品費", yomi: "しょうもうひんひ", category: "費用", normalSide: "debit", description: "文房具やコピー用紙など短期間で消費される事務用品の購入費用。" },
  { name: "修繕費", yomi: "しゅうぜんひ", category: "費用", normalSide: "debit", description: "固定資産の故障・破損を修理するための費用。" },
  { name: "保険料", yomi: "ほけんりょう", category: "費用", normalSide: "debit", description: "火災保険や自動車保険など各種保険の掛け金。" },
  { name: "租税公課", yomi: "そぜいこうか", category: "費用", normalSide: "debit", description: "印紙税、固定資産税など、国や地方公共団体に納める税金。" },
  { name: "減価償却費", yomi: "げんかしょうきゃくひ", category: "費用", normalSide: "debit", description: "固定資産の価値減少分を、耐用年数にわたって費用配分したもの。" },
  { name: "貸倒損失", yomi: "かしだおれそんしつ", category: "費用", normalSide: "debit", description: "売掛金などの債権が回収不能になったときの損失。" },
  { name: "貸倒引当金繰入", yomi: "かしだおれひきあてきんくりいれ", category: "費用", normalSide: "debit", description: "決算にあたり貸倒引当金を新たに設定・追加計上するときの費用。" },
  { name: "雑費", yomi: "ざっぴ", category: "費用", normalSide: "debit", description: "どの費用科目にも当てはまらない、金額的に重要性の低い支出。" },
  { name: "固定資産売却損", yomi: "こていしさんばいきゃくそん", category: "費用", normalSide: "debit", description: "固定資産を帳簿価額より低く売却したときに生じる差額(損失)。" },
  { name: "現金過不足", yomi: "げんきんかぶそく", category: "費用", normalSide: "debit", contra: true, description: "現金の帳簿残高と実際有高が一致しないときに一時的に用いる仮勘定。" },
];
const ACCOUNTS = rawAccounts.map((a, i) => ({ id: i + 1, ...a }));

function searchAccounts(keyword, category) {
  const kw = (keyword || "").trim();
  return ACCOUNTS.filter((a) => {
    const okCat = !category || category === "すべて" || a.category === category;
    if (!okCat) return false;
    if (!kw) return true;
    return a.name.includes(kw) || a.yomi.includes(kw) || a.description.includes(kw);
  });
}

/* ---------------- 仕訳問題データ(30問) ---------------- */
const TOPICS = ["開業・元入れ", "現金・預金", "商品売買", "手形", "貸付・借入", "給料", "前払・前受", "仮払・仮受", "諸経費", "固定資産", "貸倒れ", "決算整理"];

const rawQuestions = [
  { topic: "開業・元入れ", text: "現金¥100,000を元入れして開業した。", debit: [{ account: "現金", amount: 100000 }], credit: [{ account: "資本金", amount: 100000 }], explanation: "出資した金額は「資本金」勘定(純資産)の増加として貸方に、受け入れた現金は資産の増加として借方に記入する。" },
  { topic: "固定資産", text: "事務用の机・椅子¥30,000を購入し、代金は現金で支払った。", debit: [{ account: "備品", amount: 30000 }], credit: [{ account: "現金", amount: 30000 }], explanation: "長期間使用する事務用品は「備品」勘定(資産)に計上する。現金で支払ったので現金(資産)が減少する。" },
  { topic: "商品売買", text: "商品¥80,000を仕入れ、代金は掛けとした。", debit: [{ account: "仕入", amount: 80000 }], credit: [{ account: "買掛金", amount: 80000 }], explanation: "商品の原価は「仕入」勘定(費用)に計上する。後払いとしたので「買掛金」勘定(負債)が増加する。" },
  { topic: "商品売買", text: "商品¥120,000を売り上げ、代金は掛けとした。", debit: [{ account: "売掛金", amount: 120000 }], credit: [{ account: "売上", amount: 120000 }], explanation: "販売代金は「売上」勘定(収益)の増加として貸方に、後日受け取る権利は「売掛金」勘定(資産)の増加として借方に記入する。" },
  { topic: "商品売買", text: "買掛金¥50,000を現金で支払った。", debit: [{ account: "買掛金", amount: 50000 }], credit: [{ account: "現金", amount: 50000 }], explanation: "買掛金(負債)を支払ったので買掛金が減少し、現金(資産)も減少する。" },
  { topic: "商品売買", text: "売掛金¥70,000を現金で回収した。", debit: [{ account: "現金", amount: 70000 }], credit: [{ account: "売掛金", amount: 70000 }], explanation: "売掛金(資産)を回収したので売掛金が減少し、現金(資産)が増加する。" },
  { topic: "現金・預金", text: "現金¥200,000を当座預金口座に預け入れた。", debit: [{ account: "当座預金", amount: 200000 }], credit: [{ account: "現金", amount: 200000 }], explanation: "現金を当座預金に預け入れると、現金(資産)が減少し、当座預金(資産)が増加する。" },
  { topic: "手形", text: "商品¥90,000を仕入れ、代金は約束手形を振り出して支払った。", debit: [{ account: "仕入", amount: 90000 }], credit: [{ account: "支払手形", amount: 90000 }], explanation: "手形を振り出して支払いに充てたときは「支払手形」勘定(負債)の増加として貸方に記入する。" },
  { topic: "手形", text: "商品¥60,000を売り上げ、代金として得意先振出の約束手形を受け取った。", debit: [{ account: "受取手形", amount: 60000 }], credit: [{ account: "売上", amount: 60000 }], explanation: "手形を受け取ったときは「受取手形」勘定(資産)の増加として借方に記入する。" },
  { topic: "貸付・借入", text: "取引銀行から現金¥300,000を借り入れた。", debit: [{ account: "現金", amount: 300000 }], credit: [{ account: "借入金", amount: 300000 }], explanation: "金銭を借り入れたときは返済義務を表す「借入金」勘定(負債)の増加として貸方に記入する。" },
  { topic: "貸付・借入", text: "借入金の利息¥5,000を現金で支払った。", debit: [{ account: "支払利息", amount: 5000 }], credit: [{ account: "現金", amount: 5000 }], explanation: "借入金にかかる利息の支払いは「支払利息」勘定(費用)として処理する。" },
  { topic: "給料", text: "従業員に給料¥250,000を支払うにあたり、源泉所得税¥20,000を差し引いた残額を現金で支払った。", debit: [{ account: "給料", amount: 250000 }], credit: [{ account: "預り金", amount: 20000 }, { account: "現金", amount: 230000 }], explanation: "給料の総支給額は「給料」勘定(費用)。源泉所得税は「預り金」勘定(負債)とし、差引の手取額を現金で支払う。" },
  { topic: "前払・前受", text: "商品を注文し、内金として現金¥10,000を支払った。", debit: [{ account: "前払金", amount: 10000 }], credit: [{ account: "現金", amount: 10000 }], explanation: "商品を受け取る前に代金の一部を支払ったときは「前払金」勘定(資産)の増加として借方に記入する。" },
  { topic: "前払・前受", text: "得意先から商品の注文を受け、内金として現金¥15,000を受け取った。", debit: [{ account: "現金", amount: 15000 }], credit: [{ account: "前受金", amount: 15000 }], explanation: "商品を引き渡す前に代金の一部を受け取ったときは「前受金」勘定(負債)の増加として貸方に記入する。" },
  { topic: "仮払・仮受", text: "従業員の出張にあたり、旅費の概算額¥40,000を現金で仮払いした。", debit: [{ account: "仮払金", amount: 40000 }], credit: [{ account: "現金", amount: 40000 }], explanation: "金額や内容が確定していない支出は「仮払金」勘定(資産)として一時的に処理する。" },
  { topic: "仮払・仮受", text: "従業員が出張から戻り、上記の仮払金¥40,000について精算し、旅費交通費¥35,000を差し引いた残額を現金で受け取った。", debit: [{ account: "旅費交通費", amount: 35000 }, { account: "現金", amount: 5000 }], credit: [{ account: "仮払金", amount: 40000 }], explanation: "実際にかかった旅費交通費(費用)に振り替え、余った分は現金(資産)として受け取る。仮払金は精算により消滅する。" },
  { topic: "諸経費", text: "インターネットの利用料金¥8,000が普通預金口座から引き落とされた。", debit: [{ account: "通信費", amount: 8000 }], credit: [{ account: "普通預金", amount: 8000 }], explanation: "通信のためにかかった費用は「通信費」勘定として処理する。" },
  { topic: "諸経費", text: "電気料金¥12,000が普通預金口座から引き落とされた。", debit: [{ account: "水道光熱費", amount: 12000 }], credit: [{ account: "普通預金", amount: 12000 }], explanation: "電気・ガス・水道の使用料金は「水道光熱費」勘定(費用)で処理する。" },
  { topic: "諸経費", text: "事務所の家賃¥100,000を現金で支払った。", debit: [{ account: "支払家賃", amount: 100000 }], credit: [{ account: "現金", amount: 100000 }], explanation: "建物を借りている対価として支払う賃借料は「支払家賃」勘定(費用)で処理する。" },
  { topic: "諸経費", text: "所有する建物の家賃として¥80,000を現金で受け取った。", debit: [{ account: "現金", amount: 80000 }], credit: [{ account: "受取家賃", amount: 80000 }], explanation: "建物を貸し付けたことによる賃借料の収入は「受取家賃」勘定(収益)で処理する。" },
  { topic: "諸経費", text: "コピー用紙などの消耗品¥6,000を購入し、代金は現金で支払った。", debit: [{ account: "消耗品費", amount: 6000 }], credit: [{ account: "現金", amount: 6000 }], explanation: "短期間で消費する事務用品の購入費用は「消耗品費」勘定(費用)で処理する。" },
  { topic: "諸経費", text: "新聞に掲載する広告代¥25,000を現金で支払った。", debit: [{ account: "広告宣伝費", amount: 25000 }], credit: [{ account: "現金", amount: 25000 }], explanation: "商品の宣伝のために支出した費用は「広告宣伝費」勘定(費用)で処理する。" },
  { topic: "諸経費", text: "建物の窓ガラスが割れたため、修理業者に修繕費¥18,000を現金で支払った。", debit: [{ account: "修繕費", amount: 18000 }], credit: [{ account: "現金", amount: 18000 }], explanation: "固定資産を元の状態に戻すための修理費用は「修繕費」勘定(費用)で処理する。" },
  { topic: "諸経費", text: "火災保険料1年分¥36,000を現金で支払った。", debit: [{ account: "保険料", amount: 36000 }], credit: [{ account: "現金", amount: 36000 }], explanation: "保険契約に基づいて支払う掛け金は「保険料」勘定(費用)で処理する。" },
  { topic: "諸経費", text: "固定資産税¥45,000の納税通知書を受け取り、現金で納付した。", debit: [{ account: "租税公課", amount: 45000 }], credit: [{ account: "現金", amount: 45000 }], explanation: "国や地方公共団体に納める税金は「租税公課」勘定(費用)で処理する。" },
  { topic: "固定資産", text: "営業用の自動車¥800,000を購入し、代金は月末に支払うこととした。", debit: [{ account: "車両運搬具", amount: 800000 }], credit: [{ account: "未払金", amount: 800000 }], explanation: "営業用車両は「車両運搬具」勘定(資産)。商品以外の物品購入代金を後払いとしたときは「未払金」勘定(負債)で処理する。" },
  { topic: "固定資産", text: "使用していた備品(帳簿価額¥50,000)を¥42,000で売却し、代金は現金で受け取った。", debit: [{ account: "現金", amount: 42000 }, { account: "固定資産売却損", amount: 8000 }], credit: [{ account: "備品", amount: 50000 }], explanation: "差額¥8,000は「固定資産売却損」勘定(費用)として処理する。備品(資産)は帳簿価額分だけ減少させる。" },
  { topic: "貸倒れ", text: "得意先が倒産し、当期に発生した売掛金¥30,000が回収不能となったため、貸倒れとして処理した。", debit: [{ account: "貸倒損失", amount: 30000 }], credit: [{ account: "売掛金", amount: 30000 }], explanation: "売掛金が回収できなくなったときは「貸倒損失」勘定(費用)を計上し、売掛金(資産)を取り崩す。" },
  { topic: "決算整理", text: "決算にあたり、売掛金残高¥500,000に対して2%の貸倒れを見積もり、貸倒引当金を設定した(差額補充法、貸倒引当金残高はゼロ)。", debit: [{ account: "貸倒引当金繰入", amount: 10000 }], credit: [{ account: "貸倒引当金", amount: 10000 }], explanation: "将来の貸倒れに備えて見積計上する費用は「貸倒引当金繰入」勘定で処理し、相手科目は「貸倒引当金」勘定(貸方)とする。500,000×2%=10,000。" },
  { topic: "決算整理", text: "決算にあたり、備品(取得原価¥300,000、残存価額ゼロ、耐用年数5年)について定額法により減価償却を行った(直接法により記帳)。", debit: [{ account: "減価償却費", amount: 60000 }], credit: [{ account: "備品", amount: 60000 }], explanation: "定額法の年間減価償却費は「取得原価÷耐用年数」。300,000÷5年=60,000。直接法では備品(資産)から直接減額する。" },
];
const QUESTIONS = rawQuestions.map((q, i) => ({ id: i + 1, ...q }));
const totalAmount = (entries) => entries.reduce((s, e) => s + e.amount, 0);
const yen = new Intl.NumberFormat("ja-JP");

/* ---------------- 共通ヘッダー ---------------- */
function Header({ title, subtitle, onBack, right }) {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-md items-center gap-2 px-4 py-3">
        {onBack ? (
          <button onClick={onBack} aria-label="戻る" className="-ml-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-blue-800 hover:bg-blue-50">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
        ) : (
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-800 text-white">
            <span className="font-serif text-sm">簿</span>
          </div>
        )}
        <div className="min-w-0 flex-1">
          <h1 className="truncate font-serif text-[17px] font-bold leading-tight text-slate-900">{title}</h1>
          {subtitle && <p className="truncate text-[11px] leading-tight text-slate-500">{subtitle}</p>}
        </div>
        {right}
      </div>
    </header>
  );
}

/* ---------------- 勘定科目ピッカー(ボトムシート) ---------------- */
function AccountPicker({ open, onClose, onSelect, label }) {
  const [keyword, setKeyword] = useState("");
  const filtered = useMemo(() => {
    const kw = keyword.trim();
    if (!kw) return ACCOUNTS;
    return ACCOUNTS.filter((a) => a.name.includes(kw) || a.yomi.includes(kw));
  }, [keyword]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40" onClick={onClose}>
      <div className="w-full max-w-md rounded-t-2xl bg-white shadow-2xl" style={{ maxHeight: "82vh" }} onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 rounded-t-2xl border-b border-slate-200 bg-white px-4 pb-3 pt-3">
          <div className="mx-auto mb-2 h-1 w-10 rounded-full bg-slate-200" />
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold text-slate-900">{label || "勘定科目を選択"}</p>
            <button onClick={onClose} className="rounded-full px-2 py-1 text-xs text-slate-500 hover:bg-slate-100">閉じる</button>
          </div>
          <input autoFocus value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="科目名・よみで検索(例: うりかけ)" className="mt-2 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-700" />
        </div>
        <div className="overflow-y-auto px-2 pb-6" style={{ maxHeight: "62vh" }}>
          {filtered.length === 0 && <p className="px-3 py-6 text-center text-sm text-slate-500">該当する科目が見つかりません。</p>}
          <ul>
            {filtered.map((a) => (
              <li key={a.id}>
                <button onClick={() => { onSelect(a.name); onClose(); }} className="flex w-full items-center justify-between gap-2 rounded-lg px-3 py-3 text-left hover:bg-slate-50 active:bg-blue-50">
                  <span>
                    <span className="block text-[15px] font-bold text-slate-900">{a.name}</span>
                    <span className="block text-xs text-slate-500">{a.yomi}</span>
                  </span>
                  <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[11px] ${CATEGORY_STYLE[a.category]}`}>{a.category}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

/* ---------------- 仕訳スリップ(伝票風UI) ---------------- */
function SlipRow({ side, row, index, onChangeAccount, onChangeAmount, rowResult, submitted }) {
  const [pickerOpen, setPickerOpen] = useState(false);
  let stateClass = "border-slate-200";
  if (submitted && rowResult) stateClass = rowResult.ok ? "border-emerald-500 bg-emerald-50" : "border-red-500 bg-red-50";

  return (
    <div className={`rounded-lg border ${stateClass} p-2`}>
      <button type="button" disabled={submitted} onClick={() => setPickerOpen(true)} className={`w-full rounded-md border px-3 py-2 text-left text-[15px] ${row.account ? "border-slate-200 bg-white font-bold text-slate-900" : "border-dashed border-slate-300 bg-slate-50 text-slate-400"}`}>
        {row.account || "科目を選択"}
      </button>
      <div className="mt-1.5 flex items-center gap-1">
        <span className="font-mono text-sm text-slate-500">¥</span>
        <input inputMode="numeric" disabled={submitted} value={row.amount} onChange={(e) => onChangeAmount(e.target.value.replace(/[^0-9]/g, ""))} placeholder="0" className="w-full rounded-md border border-slate-200 bg-white px-2 py-1.5 text-right font-mono text-[15px] text-slate-900 outline-none focus:border-blue-700" />
      </div>
      {submitted && rowResult && !rowResult.ok && (
        <p className="mt-1 text-[11px] text-red-600">正解: {rowResult.correctAccount} ¥{yen.format(rowResult.correctAmount)}</p>
      )}
      <AccountPicker open={pickerOpen} onClose={() => setPickerOpen(false)} onSelect={onChangeAccount} label={side === "debit" ? `借方 ${index + 1}行目の科目` : `貸方 ${index + 1}行目の科目`} />
    </div>
  );
}

function JournalSlip({ question, answer, onChangeRow, submitted, rowResults, isBookmarked, onToggleBookmark }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-md">
      <div className="absolute bottom-0 left-6 top-0 w-px bg-red-700/30" aria-hidden="true" />
      <div className="flex items-start justify-between gap-3 border-b-2 border-blue-800 px-5 pb-3 pt-4 pl-8">
        <div>
          <p className="text-[11px] tracking-wide text-slate-500">{question.topic}</p>
          <p className="mt-1 text-[15px] leading-relaxed text-slate-900">{question.text}</p>
        </div>
        <button onClick={onToggleBookmark} aria-pressed={isBookmarked} className={`shrink-0 rounded-full border px-2 py-1 text-[11px] ${isBookmarked ? "border-red-700 bg-red-50 text-red-700" : "border-slate-200 text-slate-500"}`}>
          {isBookmarked ? "★ 復習" : "☆ 復習"}
        </button>
      </div>
      <div className="grid grid-cols-2 divide-x divide-slate-200 pl-6">
        <div className="space-y-2 p-3">
          <p className="text-center font-serif text-sm font-bold text-blue-900">借方</p>
          {answer.debit.map((row, i) => (
            <SlipRow key={i} side="debit" row={row} index={i} submitted={submitted} rowResult={rowResults?.debit?.[i]} onChangeAccount={(v) => onChangeRow("debit", i, "account", v)} onChangeAmount={(v) => onChangeRow("debit", i, "amount", v)} />
          ))}
        </div>
        <div className="space-y-2 p-3">
          <p className="text-center font-serif text-sm font-bold text-blue-900">貸方</p>
          {answer.credit.map((row, i) => (
            <SlipRow key={i} side="credit" row={row} index={i} submitted={submitted} rowResult={rowResults?.credit?.[i]} onChangeAccount={(v) => onChangeRow("credit", i, "account", v)} onChangeAmount={(v) => onChangeRow("credit", i, "amount", v)} />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ---------------- ホーム画面 ---------------- */
function Home({ onNavigate, progress, bookmarks }) {
  const answeredIds = Object.keys(progress);
  const answeredCount = answeredIds.length;
  const correctCount = answeredIds.filter((id) => progress[id]?.lastResult === "correct").length;
  const total = QUESTIONS.length;
  const pct = total ? Math.round((answeredCount / total) * 100) : 0;

  return (
    <div className="mx-auto min-h-screen max-w-md bg-slate-50 pb-10">
      <div className="bg-blue-900 px-5 pb-8 pt-9 text-white">
        <p className="text-[11px] tracking-[0.2em] text-blue-100/80">BOOKKEEPING TRAINING</p>
        <h1 className="mt-1 font-serif text-[26px] font-bold leading-tight">
          かんたん簿記<span className="ml-2 align-middle text-sm font-normal text-blue-100/90">初級</span>
        </h1>
        <p className="mt-2 text-[13px] leading-relaxed text-blue-100/90">仕訳問題と勘定科目辞典で、スキマ時間にコツコツ学べる学習アプリ。</p>
      </div>
      <div className="-mt-4 px-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-md">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-slate-500">学習の進み具合</p>
            <p className="font-mono text-xs text-slate-500">{answeredCount}/{total}問</p>
          </div>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-blue-800 transition-all" style={{ width: `${pct}%` }} />
          </div>
          <div className="mt-2 flex justify-between text-[11px] text-slate-500">
            <span>正解 {correctCount}問</span>
            <span>復習マーク {bookmarks.length}問</span>
          </div>
        </div>
      </div>
      <div className="mt-5 space-y-3 px-4">
        <button onClick={() => onNavigate("quiz")} className="flex w-full items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 text-left shadow-md active:scale-[0.99]">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-900">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none"><rect x="3" y="4" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="1.6" /><path d="M8 9h3M13 9h3M8 13h8M8 17h5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /><path d="M12 4v16" stroke="currentColor" strokeWidth="1.6" /></svg>
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-serif text-[16px] font-bold text-slate-900">仕訳問題</p>
            <p className="mt-0.5 text-[12px] leading-snug text-slate-500">取引文を読んで借方・貸方を答える、全{total}問の演習</p>
          </div>
          <span className="text-blue-800">›</span>
        </button>
        <button onClick={() => onNavigate("dictionary")} className="flex w-full items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 text-left shadow-md active:scale-[0.99]">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-900">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none"><path d="M5 4.5A1.5 1.5 0 016.5 3H18a1 1 0 011 1v16a1 1 0 01-1 1H6.5A1.5 1.5 0 015 19.5v-15z" stroke="currentColor" strokeWidth="1.6" /><path d="M8 3v18M9 7h7M9 11h7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-serif text-[16px] font-bold text-slate-900">勘定科目辞典</p>
            <p className="mt-0.5 text-[12px] leading-snug text-slate-500">科目名・読み・内容から調べられる逆引き辞典</p>
          </div>
          <span className="text-blue-800">›</span>
        </button>
      </div>
      <p className="mt-8 px-5 text-center text-[11px] leading-relaxed text-slate-500">
        【かんたん簿記 初級】は学習補助アプリです。設問内容は今後アップデートされる場合があります。
      </p>
    </div>
  );
}

/* ---------------- 仕訳問題ページ ---------------- */
const ALL = "すべて";
const BOOKMARK = "復習リスト";

function emptyAnswer(question) {
  return {
    debit: question.debit.map(() => ({ account: "", amount: "" })),
    credit: question.credit.map(() => ({ account: "", amount: "" })),
  };
}
function checkAnswer(question, answer) {
  const side = (rows, correctRows) => rows.map((row, i) => {
    const c = correctRows[i];
    return { ok: row.account === c.account && Number(row.amount || 0) === c.amount, correctAccount: c.account, correctAmount: c.amount };
  });
  const debit = side(answer.debit, question.debit);
  const credit = side(answer.credit, question.credit);
  return { debit, credit, allCorrect: [...debit, ...credit].every((r) => r.ok) };
}

function FilterBar({ filter, setFilter }) {
  const items = [ALL, BOOKMARK, ...TOPICS];
  return (
    <div className="flex gap-1.5 overflow-x-auto px-4 pb-2 pt-3">
      {items.map((t) => (
        <button key={t} onClick={() => setFilter(t)} className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-bold ${filter === t ? "border-blue-800 bg-blue-800 text-white" : "border-slate-200 bg-white text-slate-500"}`}>
          {t}
        </button>
      ))}
    </div>
  );
}

function QuizPage({ onBack, progress, setProgress, bookmarks, setBookmarks }) {
  const [filter, setFilter] = useState(ALL);
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState(null);

  const list = useMemo(() => {
    if (filter === ALL) return QUESTIONS;
    if (filter === BOOKMARK) return QUESTIONS.filter((q) => bookmarks.includes(q.id));
    return QUESTIONS.filter((q) => q.topic === filter);
  }, [filter, bookmarks]);

  const question = list[index];

  useEffect(() => { setIndex(0); }, [filter]);
  useEffect(() => {
    if (question) { setAnswer(emptyAnswer(question)); setSubmitted(false); setResult(null); }
  }, [question?.id]);

  if (!question || !answer) {
    return (
      <div className="mx-auto min-h-screen max-w-md bg-slate-50 pb-10">
        <Header title="仕訳問題" onBack={onBack} />
        <FilterBar filter={filter} setFilter={setFilter} />
        {!question && (
          <div className="mt-10 px-6 text-center">
            <p className="text-sm text-slate-500">
              {filter === BOOKMARK ? "まだ復習リストに問題がありません。問題を解いて「☆ 復習」をタップすると、ここに追加されます。" : "該当する問題がありません。"}
            </p>
          </div>
        )}
      </div>
    );
  }

  const listStats = list.reduce((acc, q) => {
    const r = progress[q.id]?.lastResult;
    if (r === "correct") acc.correct += 1;
    return acc;
  }, { correct: 0 });

  function onChangeRow(side, i, field, value) {
    setAnswer((prev) => ({ ...prev, [side]: prev[side].map((r, idx) => (idx === i ? { ...r, [field]: value } : r)) }));
  }
  function handleSubmit() {
    const r = checkAnswer(question, answer);
    setResult(r);
    setSubmitted(true);
    setProgress((prev) => {
      const p = prev[question.id] || { correctCount: 0, wrongCount: 0 };
      return { ...prev, [question.id]: { correctCount: p.correctCount + (r.allCorrect ? 1 : 0), wrongCount: p.wrongCount + (r.allCorrect ? 0 : 1), lastResult: r.allCorrect ? "correct" : "incorrect" } };
    });
  }
  const goNext = () => setIndex((i) => Math.min(i + 1, list.length - 1));
  const goPrev = () => setIndex((i) => Math.max(i - 1, 0));
  const toggleBookmark = () => setBookmarks((prev) => (prev.includes(question.id) ? prev.filter((id) => id !== question.id) : [...prev, question.id]));

  const isLast = index === list.length - 1;
  const debitTotal = totalAmount(question.debit);

  return (
    <div className="mx-auto min-h-screen max-w-md bg-slate-50 pb-28">
      <Header title="仕訳問題" subtitle={`${index + 1} / ${list.length}問目・${filter}`} onBack={onBack} />
      <FilterBar filter={filter} setFilter={setFilter} />
      <div className="px-4 pt-1">
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
          <div className="h-full rounded-full bg-blue-800 transition-all" style={{ width: `${((index + 1) / list.length) * 100}%` }} />
        </div>
        <p className="mt-1 text-right text-[11px] text-slate-500">このリストの正解 {listStats.correct}/{list.length}</p>
      </div>
      <div className="px-4 pt-2">
        <JournalSlip question={question} answer={answer} onChangeRow={onChangeRow} submitted={submitted} rowResults={result} isBookmarked={bookmarks.includes(question.id)} onToggleBookmark={toggleBookmark} />
        {submitted && (
          <div className={`mt-3 rounded-xl border p-4 ${result.allCorrect ? "border-emerald-300 bg-emerald-50" : "border-red-300 bg-red-50"}`}>
            <p className={`font-serif text-[15px] font-bold ${result.allCorrect ? "text-emerald-700" : "text-red-700"}`}>{result.allCorrect ? "正解です" : "不正解"}</p>
            <p className="mt-1.5 text-[13px] leading-relaxed text-slate-900">{question.explanation}</p>
            <p className="mt-1.5 font-mono text-[11px] text-slate-500">合計 ¥{debitTotal.toLocaleString("ja-JP")}</p>
          </div>
        )}
      </div>
      <div className="fixed inset-x-0 bottom-0 z-20 mx-auto max-w-md border-t border-slate-200 bg-white/95 px-4 py-3 backdrop-blur">
        <div className="flex gap-2">
          <button onClick={goPrev} disabled={index === 0} className="rounded-lg border border-slate-200 px-4 py-3 text-sm font-bold text-slate-500 disabled:opacity-40">前へ</button>
          {!submitted ? (
            <button onClick={handleSubmit} className="flex-1 rounded-lg bg-blue-800 py-3 text-sm font-bold text-white active:bg-blue-900">答え合わせ</button>
          ) : isLast ? (
            <button onClick={onBack} className="flex-1 rounded-lg bg-blue-900 py-3 text-sm font-bold text-white">お疲れさまでした・ホームへ</button>
          ) : (
            <button onClick={goNext} className="flex-1 rounded-lg bg-blue-800 py-3 text-sm font-bold text-white active:bg-blue-900">次の問題へ</button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ---------------- 勘定科目辞典ページ ---------------- */
const SIDE_LABEL = { debit: "借方", credit: "貸方" };

function DictionaryPage({ onBack }) {
  const [keyword, setKeyword] = useState("");
  const [category, setCategory] = useState("すべて");
  const [openId, setOpenId] = useState(null);
  const results = useMemo(() => searchAccounts(keyword, category), [keyword, category]);

  return (
    <div className="mx-auto min-h-screen max-w-md bg-slate-50 pb-10">
      <Header title="勘定科目辞典" subtitle="科目名・読み・内容から探せます" onBack={onBack} />
      <div className="px-4 pt-4">
        <div className="relative">
          <input value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="例:「うりかけ」「決算」「保険」で検索" className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 pl-9 text-sm text-slate-900 outline-none focus:border-blue-700" />
          <svg className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.8" /><path d="M21 21l-4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
        </div>
        <div className="mt-3 flex gap-1.5 overflow-x-auto pb-1">
          {["すべて", ...CATEGORIES].map((c) => (
            <button key={c} onClick={() => setCategory(c)} className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-bold ${category === c ? "border-blue-800 bg-blue-800 text-white" : "border-slate-200 bg-white text-slate-500"}`}>{c}</button>
          ))}
        </div>
        <p className="mt-2 text-[11px] text-slate-500">{results.length}件ヒット</p>
      </div>
      <ul className="mt-2 space-y-2 px-4">
        {results.map((a) => {
          const open = openId === a.id;
          return (
            <li key={a.id} className="rounded-xl border border-slate-200 bg-white shadow-md">
              <button onClick={() => setOpenId(open ? null : a.id)} className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left">
                <span>
                  <span className="block font-serif text-[15px] font-bold text-slate-900">{a.name}</span>
                  <span className="block text-[11px] text-slate-500">{a.yomi}</span>
                </span>
                <span className="flex shrink-0 items-center gap-2">
                  <span className={`rounded-full border px-2 py-0.5 text-[11px] ${CATEGORY_STYLE[a.category]}`}>{a.category}</span>
                  <span className={`text-slate-400 transition-transform ${open ? "rotate-180" : ""}`}>⌄</span>
                </span>
              </button>
              {open && (
                <div className="border-t border-slate-200 px-4 py-3">
                  <p className="text-[13px] leading-relaxed text-slate-900">{a.description}</p>
                  <p className="mt-2 text-[11px] text-slate-500">
                    通常記入される側: <span className="font-bold text-blue-900">{SIDE_LABEL[a.normalSide]}</span>
                    {a.contra && "(評価・マイナス項目)"}
                  </p>
                </div>
              )}
            </li>
          );
        })}
        {results.length === 0 && (
          <li className="rounded-xl border border-dashed border-slate-300 bg-white px-4 py-8 text-center text-sm text-slate-500">該当する勘定科目が見つかりませんでした。</li>
        )}
      </ul>
    </div>
  );
}

/* ---------------- localStorage同期フック ----------------
   ブラウザのlocalStorageに保存する簡易実装。
   将来、復習機能をサーバー同期(Upstash等)に拡張する際は
   この関数の中身だけ差し替えれば良いようにしてある。 */
function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch {
      return initialValue;
    }
  });
  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // 保存に失敗しても学習の妨げにならないよう握りつぶす
    }
  }, [key, value]);
  return [value, setValue];
}

/* ---------------- App(ルート) ---------------- */
export default function App() {
  const [screen, setScreen] = useState("home");
  const [progress, setProgress] = useLocalStorage("kantanBoki:progress", {});
  const [bookmarks, setBookmarks] = useLocalStorage("kantanBoki:bookmarks", []);

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      {screen === "home" && <Home onNavigate={setScreen} progress={progress} bookmarks={bookmarks} />}
      {screen === "quiz" && <QuizPage onBack={() => setScreen("home")} progress={progress} setProgress={setProgress} bookmarks={bookmarks} setBookmarks={setBookmarks} />}
      {screen === "dictionary" && <DictionaryPage onBack={() => setScreen("home")} />}
    </div>
  );
}
