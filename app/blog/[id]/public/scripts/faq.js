// FAQのスタイリングを適用するためのJavaScript
// p:has()セレクタをサポートしていないブラウザ向けのフォールバック処理

document.addEventListener('DOMContentLoaded', function() {
  // クラス名を持つpタグにスタイルを適用
  applyFaqStyles();
  // 余分なbrタグを削除
  removeBrTagsBeforeFaqAnswer();
});

function applyFaqStyles() {
  // 質問スタイルの適用
  const questionElements = document.querySelectorAll('p.faq-question, p:has(.faq-question)');
  questionElements.forEach(function(element) {
    if (element.tagName.toLowerCase() === 'p') {
      if (!element.classList.contains('faq_parent_question')) {
        element.classList.add('faq_parent_question');
      }
    }
  });

  // innerHTMLにfaq-questionクラスを含むがp自体にはクラスがない場合
  const allParagraphs = document.querySelectorAll('p');
  allParagraphs.forEach(function(p) {
    if (p.innerHTML.includes('faq-question') && !p.classList.contains('faq-question') && !p.classList.contains('faq_parent_question')) {
      p.classList.add('faq_parent_question');
    }
    
    if (p.innerHTML.includes('faq-answer') && !p.classList.contains('faq-answer') && !p.classList.contains('faq_parent_answer')) {
      p.classList.add('faq_parent_answer');
    }
  });

  // 回答スタイルの適用
  const answerElements = document.querySelectorAll('p.faq-answer, p:has(.faq-answer)');
  answerElements.forEach(function(element) {
    if (element.tagName.toLowerCase() === 'p') {
      if (!element.classList.contains('faq_parent_answer')) {
        element.classList.add('faq_parent_answer');
      }
    }
  });
}

// faq-answerクラスの前のbrタグを削除する処理
function removeBrTagsBeforeFaqAnswer() {
  // faq-answerクラスを持つ要素またはそれを内包する要素を取得
  const faqAnswerElements = document.querySelectorAll('p.faq-answer, p:has(.faq-answer), p.faq_parent_answer');
  
  faqAnswerElements.forEach(function(element) {
    // 前の要素がbrタグかチェック
    let previousSibling = element.previousSibling;
    
    // previousSiblingがnullでなく、テキストノードの場合はその前を探る
    while (previousSibling && previousSibling.nodeType === Node.TEXT_NODE && previousSibling.textContent.trim() === '') {
      const temp = previousSibling.previousSibling;
      previousSibling.remove();
      previousSibling = temp;
    }
    
    // 前の要素がbrタグなら削除
    if (previousSibling && previousSibling.tagName && previousSibling.tagName.toLowerCase() === 'br') {
      previousSibling.remove();
    }
    
    // spanを含む場合も対応
    if (element.innerHTML.includes('faq-answer')) {
      const faqAnswerSpan = element.querySelector('.faq-answer');
      if (faqAnswerSpan) {
        // spanの前にあるbrタグを探して削除
        let node = faqAnswerSpan;
        while (node.previousSibling) {
          node = node.previousSibling;
          if (node.nodeType === Node.ELEMENT_NODE && node.tagName.toLowerCase() === 'br') {
            node.remove();
            break;
          } else if (node.nodeType === Node.TEXT_NODE && node.textContent.trim() === '') {
            continue;
          } else {
            break;
          }
        }
      }
    }
  });
  
  // innerHTMLに直接brタグが含まれる場合も対応
  document.querySelectorAll('article').forEach(function(article) {
    const html = article.innerHTML;
    const cleanedHtml = html.replace(/<br\s*\/?>\s*<(p[^>]*class="[^"]*faq-answer[^"]*"[^>]*>)/g, '<$1');
    article.innerHTML = cleanedHtml;
  });
}

// 動的にコンテンツが追加された場合やAjaxロード後にも対応
const observer = new MutationObserver(function(mutations) {
  mutations.forEach(function(mutation) {
    if (mutation.type === 'childList') {
      applyFaqStyles();
      removeBrTagsBeforeFaqAnswer();
    }
  });
});

// ドキュメントの変更を監視
observer.observe(document.body, {
  childList: true,
  subtree: true
}); 