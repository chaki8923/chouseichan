/**
 * fukidasi_manとfukidasi_femailクラスを持つ要素の親pタグにクラスを追加する
 * :hasセレクタをサポートしていないブラウザ向けのフォールバック
 */
document.addEventListener('DOMContentLoaded', function() {
  // :hasセレクタのサポート状況を確認
  const hasHasSelector = CSS.supports('selector(:has(*))');
  
  // :hasセレクタがサポートされていない場合のみ実行
  if (!hasHasSelector) {
    console.log('このブラウザでは:hasセレクタがサポートされていないため、JavaScriptでスタイルを適用します');
    
    // 男性用吹き出しの親要素にクラスを追加
    applyParentClass('fukidasi_man', 'fukidasi_parent_man');
    
    // 女性用吹き出しの親要素にクラスを追加
    applyParentClass('fukidasi_femail', 'fukidasi_parent_femail');
  }
});

/**
 * 特定のクラスを持つ要素の親pタグにクラスを追加する関数
 * @param {string} childClass - 子要素のクラス名
 * @param {string} parentClass - 親要素に追加するクラス名
 */
function applyParentClass(childClass, parentClass) {
  // 対象の子要素を取得
  const elements = document.querySelectorAll('.' + childClass);
  
  elements.forEach(function(element) {
    const parent = element.parentNode;
    
    // 親要素がpタグの場合のみクラスを追加
    if (parent && parent.tagName.toLowerCase() === 'p') {
      parent.classList.add(parentClass);
    }
  });
} 