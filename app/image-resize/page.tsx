'use client';

import { useState, useRef, useCallback, useEffect, Suspense } from 'react';
import { FiUpload, FiDownload, FiSettings, FiX, FiImage, FiHome } from 'react-icons/fi';
import styles from './resize.module.scss';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

const DEFAULT_MAX_WIDTH = 1200;
const DEFAULT_MAX_HEIGHT = 1200;
const DEFAULT_QUALITY = 0.8;

// クライアントコンポーネントとして実装
const ImageResizeContent = () => {
  const searchParams = useSearchParams();
  const eventId = searchParams.get('eventId');
  const fromForm = searchParams.get('from_form') === 'true';
  const fromEvent = searchParams.get('from_event') === 'true';
  
  const [originalImage, setOriginalImage] = useState<File | null>(null);
  const [originalPreview, setOriginalPreview] = useState<string | null>(null);
  const [resizedImage, setResizedImage] = useState<Blob | null>(null);
  const [resizedPreview, setResizedPreview] = useState<string | null>(null);
  const [isResizing, setIsResizing] = useState(false);
  const [settings, setSettings] = useState({
    maxWidth: DEFAULT_MAX_WIDTH,
    maxHeight: DEFAULT_MAX_HEIGHT,
    quality: DEFAULT_QUALITY,
    format: 'jpeg' as 'jpeg' | 'png' | 'webp',
  });
  const [originalSizeText, setOriginalSizeText] = useState<string>('');
  const [resizedSizeText, setResizedSizeText] = useState<string>('');
  const [originalSizeBytes, setOriginalSizeBytes] = useState<number>(0);
  const [resizedSizeBytes, setResizedSizeBytes] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isMobile, setIsMobile] = useState(false);

  // 入力値が無効になった場合の処理を修正
  useEffect(() => {
    // 入力値がNaN、負数、またはゼロの場合のみ修正
    // 空文字列('') の場合は何もしない
    if (
      (typeof settings.maxWidth === 'number' && (isNaN(settings.maxWidth) || settings.maxWidth <= 0)) || 
      (typeof settings.maxHeight === 'number' && (isNaN(settings.maxHeight) || settings.maxHeight <= 0)) ||
      (isNaN(settings.quality))
    ) {
      setSettings(prev => ({
        ...prev,
        // 負数やNaNのみをデフォルト値に置き換え、空文字列('') はそのまま
        maxWidth: typeof prev.maxWidth === 'number' && (isNaN(prev.maxWidth) || prev.maxWidth <= 0) 
          ? DEFAULT_MAX_WIDTH 
          : prev.maxWidth,
        maxHeight: typeof prev.maxHeight === 'number' && (isNaN(prev.maxHeight) || prev.maxHeight <= 0) 
          ? DEFAULT_MAX_HEIGHT 
          : prev.maxHeight,
        quality: isNaN(prev.quality) ? DEFAULT_QUALITY : prev.quality
      }));
    }
  }, [settings.maxWidth, settings.maxHeight, settings.quality]);

  // 画面サイズの監視
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    // 初期チェック
    checkScreenSize();
    
    // リサイズイベントの監視
    window.addEventListener('resize', checkScreenSize);
    
    // クリーンアップ
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // 画像をアップロードする処理
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    const file = files[0];
    if (!file.type.startsWith('image/')) {
      setErrorMessage('画像ファイルをアップロードしてください');
      return;
    }

    setErrorMessage(null);
    setOriginalImage(file);
    setOriginalSizeBytes(file.size);
    setOriginalSizeText(formatFileSize(file.size));
    
    // 元の画像のプレビューを作成
    const objectUrl = URL.createObjectURL(file);
    setOriginalPreview(objectUrl);
    
    // リサイズ済み画像をリセット
    if (resizedPreview) {
      URL.revokeObjectURL(resizedPreview);
      setResizedPreview(null);
    }
    setResizedImage(null);
    setResizedSizeText('');
    setResizedSizeBytes(0);
  };

  // ファイルサイズをフォーマットする関数
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // サイズ削減率を計算する関数
  const calculateReduction = (): number => {
    if (originalSizeBytes <= 0 || resizedSizeBytes <= 0) return 0;
    return Math.round((1 - (resizedSizeBytes / originalSizeBytes)) * 100);
  };

  // 入力値が有効かどうかを検証する関数
  const isInputValid = useCallback(() => {
    // 画像が選択されていない場合は無効
    if (!originalImage) return false;
    
    // リサイズ処理中は無効
    if (isResizing) return false;
    
    // 幅の検証
    if (
      settings.maxWidth === '' as unknown as number || 
      !settings.maxWidth
    ) return false;
    
    // 高さの検証
    if (
      settings.maxHeight === '' as unknown as number || 
      !settings.maxHeight
    ) return false;
    
    // 入力が文字列型で、"0"や"000"などの無効な値を検出
    if (typeof settings.maxWidth === 'string') {
      const numWidth = parseInt(settings.maxWidth, 10);
      if (isNaN(numWidth) || numWidth <= 0) return false;
    }
    
    if (typeof settings.maxHeight === 'string') {
      const numHeight = parseInt(settings.maxHeight, 10);
      if (isNaN(numHeight) || numHeight <= 0) return false;
    }
    
    // すべての検証をパスした場合は有効
    return true;
  }, [originalImage, isResizing, settings.maxWidth, settings.maxHeight]);

  // 画像をリサイズする処理
  const resizeImage = useCallback(async () => {
    if (!originalImage || !originalPreview) {
      setErrorMessage('リサイズする画像をアップロードしてください');
      return;
    }
    
    // 最大幅と最大高さの値をチェック
    if (
      settings.maxWidth === '' as unknown as number || 
      settings.maxHeight === '' as unknown as number || 
      !settings.maxWidth || 
      !settings.maxHeight
    ) {
      setErrorMessage('有効な最大幅と最大高さを入力してください');
      return;
    }

    setIsResizing(true);
    setErrorMessage(null);

    try {
      const img = new Image();
      img.src = originalPreview;
      
      await new Promise((resolve) => {
        img.onload = resolve;
      });

      // 画像のサイズを計算
      let width = img.width;
      let height = img.height;
      
      // 値が文字列か数値かを確認し、適切に処理する
      let maxWidth: number;
      let maxHeight: number;
      
      if (typeof settings.maxWidth === 'string') {
        // 文字列の場合は整数に変換（先頭の0を含む入力に対応）
        maxWidth = parseInt(settings.maxWidth, 10);
        if (isNaN(maxWidth) || maxWidth <= 0 || maxWidth > 10000) {
          maxWidth = DEFAULT_MAX_WIDTH;
        }
      } else {
        // すでに数値の場合はそのまま使用
        maxWidth = typeof settings.maxWidth === 'number' ? settings.maxWidth : DEFAULT_MAX_WIDTH;
      }
      
      if (typeof settings.maxHeight === 'string') {
        // 文字列の場合は整数に変換（先頭の0を含む入力に対応）
        maxHeight = parseInt(settings.maxHeight, 10);
        if (isNaN(maxHeight) || maxHeight <= 0 || maxHeight > 10000) {
          maxHeight = DEFAULT_MAX_HEIGHT;
        }
      } else {
        // すでに数値の場合はそのまま使用
        maxHeight = typeof settings.maxHeight === 'number' ? settings.maxHeight : DEFAULT_MAX_HEIGHT;
      }
      
      // アスペクト比を維持しながらリサイズ
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width = Math.floor(width * ratio);
        height = Math.floor(height * ratio);
      }
      
      // Canvasを使用して画像をリサイズ
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        throw new Error('Canvas 2D contextを取得できませんでした');
      }
      
      ctx.drawImage(img, 0, 0, width, height);
      
      // リサイズした画像をBlobとして取得
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((result) => {
          if (result) {
            resolve(result);
          } else {
            reject(new Error('Blobの生成に失敗しました'));
          }
        }, `image/${settings.format}`, settings.quality);
      });
      
      // リサイズした画像のサイズとプレビューを設定
      setResizedImage(blob);
      setResizedSizeBytes(blob.size);
      setResizedSizeText(formatFileSize(blob.size));
      
      // 以前のプレビューがあれば解放
      if (resizedPreview) {
        URL.revokeObjectURL(resizedPreview);
      }
      
      // 新しいプレビューを設定
      const objectUrl = URL.createObjectURL(blob);
      setResizedPreview(objectUrl);


    } catch (error) {
      console.error('リサイズエラー:', error);
      setErrorMessage('画像のリサイズ中にエラーが発生しました');
    } finally {
      setIsResizing(false);
    }
  }, [originalImage, originalPreview, settings]);

  // リサイズした画像をダウンロードする処理
  const downloadResizedImage = useCallback(() => {
    if (!resizedImage || !resizedPreview) {
      setErrorMessage('ダウンロードする画像がありません');
      return;
    }

    // ファイル名を生成（元のファイル名をベースに）
    const fileName = originalImage ? 
      `chouseichan-${originalImage.name.replace(/\.[^/.]+$/, '')}.${settings.format}` : 
      `chouseichan-resized-image.${settings.format}`;

    // ダウンロードリンクを作成
    const downloadLink = document.createElement('a');
    downloadLink.href = resizedPreview;
    downloadLink.download = fileName;
    downloadLink.click();
  }, [resizedImage, resizedPreview, originalImage, settings.format]);

  // 値が変更されたときの処理
  const handleSettingChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // 入力値の検証
    if (name === 'maxWidth' || name === 'maxHeight') {
      // 全角数字を半角に変換
      const convertedValue = value.replace(/[０-９]/g, (s) => {
        return String.fromCharCode(s.charCodeAt(0) - 0xFEE0);
      }).replace(/[^0-9]/g, ''); // 数字以外は削除
      
      // 変換後の値を入力欄に反映（元の値と変わっていれば）
      if (convertedValue !== value) {
        // inputのvalueを直接変更
        e.target.value = convertedValue;
      }
      
      // 空の文字列の場合は空のままにする
      if (convertedValue === '') {
        setSettings(prev => ({
          ...prev,
          [name]: '' as unknown as number
        }));
        return;
      }
      
      // convertedValueをそのまま保持して、数値変換するのは実際のリサイズ操作時のみに
      // 先頭の0を含む数値を許容する（例：000、01200など）
      setSettings(prev => ({
        ...prev,
        [name]: convertedValue as unknown as number
      }));
      
      // 数値チェックは行うが、stateの更新には使用しない
      const numValue = parseInt(convertedValue, 10);
      // 数値が無効な場合はコンソールに警告だけ出す
      if (isNaN(numValue) || numValue <= 0 || numValue > 10000) {
        console.warn(`Invalid ${name} value: ${convertedValue}`);
      }
    } 
    else if (name === 'quality') {
      // qualityの場合は0.1〜1.0の範囲に制限
      const numValue = parseFloat(value);
      if (isNaN(numValue)) {
        return;
      }
      
      const clampedValue = Math.max(0.1, Math.min(1, numValue));
      setSettings(prev => ({
        ...prev,
        quality: clampedValue
      }));
    } 
    else {
      // formatなど他の値の場合
      setSettings(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  // 入力制限を適用する関数（数値のみ許可）
  const handleNumberInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // 数字、矢印キー、削除キー、バックスペース、タブ以外は入力を禁止
    const allowedKeys = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'ArrowLeft', 'ArrowRight', 'Delete', 'Backspace', 'Tab'];
    // 制御キーやAlt、Ctrlとの組み合わせは許可
    if (e.ctrlKey || e.altKey || e.metaKey) {
      return;
    }
    if (!allowedKeys.includes(e.key)) {
      e.preventDefault();
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.headerSection}>
        <h1 className={styles.header}>画像圧縮ツール</h1>
        <p className={styles.description}>
          イベント用の画像を簡単に圧縮できます。1MB以下に最適化して投稿しましょう。
        </p>
        
        {/* 元のページに戻るボタン */}
        <div className={styles.navigationButtons}>
          {fromForm && (
            <Link 
              href="/?from_resize=true" 
              className={styles.backButton}
            >
              <FiHome className={styles.backIcon} />
              新規イベント作成に戻る
            </Link>
          )}
          
          {fromEvent && eventId && (
            <Link 
              href={`/event?eventId=${eventId}&from_resize=true`} 
              className={styles.backButton}
            >
              <FiImage className={styles.backIcon} />
              イベントに戻る
            </Link>
          )}
          
          {!fromForm && !fromEvent && (
            <Link 
              href="/" 
              className={styles.backButton}
            >
              <FiHome className={styles.backIcon} />
              トップページに戻る
            </Link>
          )}
        </div>
      </div>

      <div className={styles.mainContent}>
        <div className={`${styles.uploadSection} ${isMobile ? styles.fullWidth : ''}`}>
          <div 
            className={styles.dropZone}
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            onDrop={(e) => {
              e.preventDefault();
              e.stopPropagation();
              
              const files = Array.from(e.dataTransfer.files);
              if (files.length > 0 && files[0].type.startsWith('image/')) {
                setOriginalImage(files[0]);
                setOriginalSizeBytes(files[0].size);
                setOriginalSizeText(formatFileSize(files[0].size));
                
                const objectUrl = URL.createObjectURL(files[0]);
                setOriginalPreview(objectUrl);
                
                if (resizedPreview) {
                  URL.revokeObjectURL(resizedPreview);
                  setResizedPreview(null);
                }
                setResizedImage(null);
                setResizedSizeText('');
                setResizedSizeBytes(0);
              } else {
                setErrorMessage('画像ファイルをアップロードしてください');
              }
            }}
          >
            <FiUpload className={styles.uploadIcon} />
            <p className={styles.dropZoneText}>
              ここに画像をドラッグ&ドロップまたはクリックしてアップロード
            </p>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageUpload}
              accept="image/*"
              className={styles.fileInput}
            />
          </div>

          {errorMessage && (
            <div className={styles.errorMessage}>
              <FiX className={styles.errorIcon} />
              {errorMessage}
            </div>
          )}

          {/* モバイル表示かつ画像がアップロードされている場合に元の画像プレビューを表示 */}
          {isMobile && originalPreview && (
            <div className={`${styles.previewCard} ${styles.mobileOriginalPreview}`}>
              <h3 className={styles.previewTitle}>元の画像</h3>
              <div className={styles.imagePreview}>
                <img src={originalPreview} alt="元の画像" className={styles.previewImg} />
                <div className={styles.imageMeta}>サイズ: {originalSizeText}</div>
              </div>
            </div>
          )}

          <div className={styles.settingsPanel}>
            <h3 className={styles.settingsTitle}>
              <FiSettings className={styles.settingsIcon} />
              リサイズ設定
            </h3>
            
            <div className={styles.settingsGrid}>
              <div className={styles.settingGroup}>
                <label htmlFor="maxWidth" className={styles.settingLabel}>最大幅 (px) <span className={styles.defaultValue}>(デフォルト: 1200)</span></label>
                <input
                  id="maxWidth"
                  name="maxWidth"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  min="100"
                  max="4000"
                  value={settings.maxWidth === '' as unknown as number ? '' : typeof settings.maxWidth === 'string' ? settings.maxWidth : settings.maxWidth.toString()}
                  onChange={handleSettingChange}
                  onKeyDown={handleNumberInputKeyDown}
                  placeholder="最大幅を入力 (例: 1200)"
                  className={styles.settingInput}
                />
                <div className={styles.fieldHelp}>1以上の値を入力してください</div>
              </div>
              
              <div className={styles.settingGroup}>
                <label htmlFor="maxHeight" className={styles.settingLabel}>最大高さ (px) <span className={styles.defaultValue}>(デフォルト: 1200)</span></label>
                <input
                  id="maxHeight"
                  name="maxHeight"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  min="100"
                  max="4000"
                  value={settings.maxHeight === '' as unknown as number ? '' : typeof settings.maxHeight === 'string' ? settings.maxHeight : settings.maxHeight.toString()}
                  onChange={handleSettingChange}
                  onKeyDown={handleNumberInputKeyDown}
                  placeholder="最大高さを入力 (例: 1200)"
                  className={styles.settingInput}
                />
                <div className={styles.fieldHelp}>1以上の値を入力してください</div>
              </div>
              
              <div className={styles.settingGroup}>
                <label htmlFor="quality" className={styles.settingLabel}>品質 ({Math.round(settings.quality * 100)}%)</label>
                <input
                  id="quality"
                  name="quality"
                  type="range"
                  min="0.1"
                  max="1"
                  step="0.1"
                  value={settings.quality}
                  onChange={handleSettingChange}
                  className={styles.settingInput}
                />
              </div>
              
              <div className={styles.settingGroup}>
                <label htmlFor="format" className={styles.settingLabel}>形式</label>
                <select
                  id="format"
                  name="format"
                  value={settings.format}
                  onChange={handleSettingChange}
                  className={styles.settingInput}
                >
                  <option value="jpeg">JPEG</option>
                  <option value="png">PNG</option>
                  <option value="webp">WebP</option>
                </select>
              </div>
            </div>
            
            <button
              className={styles.resizeButton}
              onClick={resizeImage}
              disabled={!isInputValid()}
            >
              {isResizing ? '処理中...' : '画像をリサイズ'}
            </button>
          </div>
        </div>
        
        <div className={styles.previewSection}>
          <div className={styles.previewContainer}>
            {/* PC表示の場合のみ元の画像プレビューを表示 */}
            {!isMobile && (
              <div className={styles.previewCard}>
                <h3 className={styles.previewTitle}>元の画像</h3>
                <div className={styles.imagePreview}>
                  {originalPreview ? (
                    <>
                      <img src={originalPreview} alt="元の画像" className={styles.previewImg} />
                      <div className={styles.imageMeta}>サイズ: {originalSizeText}</div>
                    </>
                  ) : (
                    <div className={styles.noImage}>
                      <FiImage className={styles.noImageIcon} />
                      <p>プレビューなし</p>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            <div className={styles.previewCard}>
              <h3 className={styles.previewTitle}>リサイズした画像</h3>
              <div className={styles.imagePreview}>
                {resizedPreview ? (
                  <>
                    <img src={resizedPreview} alt="リサイズした画像" className={styles.previewImg} />
                    <div className={styles.imageMeta}>
                      サイズ: {resizedSizeText}
                      {originalSizeBytes > 0 && resizedSizeBytes > 0 && (
                        <span className={styles.sizeReduction}>
                          ({calculateReduction()}% 削減)
                        </span>
                      )}
                    </div>
                    <button 
                      className={styles.downloadButton}
                      onClick={downloadResizedImage}
                    >
                      <FiDownload className={styles.downloadIcon} />
                      ダウンロード
                    </button>
                  </>
                ) : (
                  <div className={styles.noImage}>
                    <FiImage className={styles.noImageIcon} />
                    <p>プレビューなし</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
        {/* 元のページに戻るボタン */}
        <div className={`${styles.navigationButtons} ${styles.sp}`}>
          {fromForm && (
            <Link 
              href="/?from_resize=true" 
              className={styles.backButton}
            >
              <FiHome className={styles.backIcon} />
              新規イベント作成に戻る
            </Link>
          )}
          
          {fromEvent && eventId && (
            <Link 
              href={`/event?eventId=${eventId}&from_resize=true`} 
              className={styles.backButton}
            >
              <FiImage className={styles.backIcon} />
              イベントに戻る
            </Link>
          )}
          
          {!fromForm && !fromEvent && (
            <Link 
              href="/" 
              className={styles.backButton}
            >
              <FiHome className={styles.backIcon} />
              トップページに戻る
            </Link>
          )}
        </div>

      <div className={styles.instructionsSection}>
        <h2 className={styles.instructionsTitle}>使い方</h2>
        <ol className={styles.instructionsList}>
          <li>画像をアップロードエリアにドラッグ&ドロップするか、クリックして選択します。</li>
          <li>必要に応じてリサイズ設定（最大幅、最大高さ、品質、形式）を調整します。</li>
          <li>「画像をリサイズ」ボタンをクリックして画像を処理します。</li>
          <li>リサイズされた画像が表示されたら、「ダウンロード」ボタンをクリックして保存します。</li>
          <li>保存した軽量化された画像をイベント登録時にアップロードしてください。</li>
        </ol>
      </div>
    </div>
  );
};

// メインのページコンポーネント
const ImageResizePage = () => {
  return (
    <Suspense fallback={<div className={styles.loading}>読み込み中...</div>}>
      <ImageResizeContent />
    </Suspense>
  );
};

export default ImageResizePage; 