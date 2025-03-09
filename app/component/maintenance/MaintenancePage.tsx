'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { maintenanceInfo } from '@/app/config/features';
import { FiSettings, FiClock, FiInfo, FiMail } from 'react-icons/fi';

const MaintenancePage: React.FC = () => {
  const [countdown, setCountdown] = useState<string>('');
  const [isAnimating, setIsAnimating] = useState<boolean>(false);

  // メンテナンス終了時間からのカウントダウン（終了時間が設定されている場合）
  useEffect(() => {
    if (maintenanceInfo.scheduledEndTime && maintenanceInfo.scheduledEndTime !== '未定') {
      try {
        const endTimeDate = new Date(maintenanceInfo.scheduledEndTime);
        
        // 現在時刻と終了時刻が有効であれば、カウントダウンを設定
        if (!isNaN(endTimeDate.getTime())) {
          const timer = setInterval(() => {
            const now = new Date();
            const diff = endTimeDate.getTime() - now.getTime();
            
            if (diff <= 0) {
              clearInterval(timer);
              setCountdown('メンテナンス終了予定時刻を過ぎています');
              return;
            }
            
            const hours = Math.floor(diff / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);
            
            setCountdown(`${hours}時間 ${minutes}分 ${seconds}秒`);
          }, 1000);
          
          return () => clearInterval(timer);
        }
      } catch (e) {
        console.error('日付の解析に失敗しました:', e);
      }
    }
  }, []);

  // 歯車アニメーションの制御
  useEffect(() => {
    const animationTimer = setInterval(() => {
      setIsAnimating(true);
      setTimeout(() => setIsAnimating(false), 3000);
    }, 5000);

    return () => clearInterval(animationTimer);
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100 px-4">
      <div className="max-w-3xl w-full bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="bg-gradient-to-r from-pink-500 to-rose-500 p-6 text-white text-center">
          <div className="flex justify-center items-center mb-4">
            <div className={`relative ${isAnimating ? 'animate-spin-slow' : ''} mr-3`}>
              <FiSettings size={32} />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold">メンテナンス中</h1>
          </div>
          <p className="text-lg opacity-90">ただいまサイトはメンテナンス中です</p>
        </div>
        
        <div className="p-6 md:p-8">
          <div className="mb-6 text-center">
            <Image 
              src="/logo.png" 
              alt="調整ちゃんロゴ" 
              width={150} 
              height={150} 
              className="mx-auto mb-4"
            />
            <p className="text-gray-600 text-lg mb-2">
              より良いサービスを提供するために、システムメンテナンスを実施しています。
            </p>
            <p className="text-gray-600">
              ご不便をおかけして申し訳ありませんが、しばらくお待ちください。
            </p>
          </div>
          
          <div className="bg-gray-50 rounded-xl p-5 mb-6">
            <div className="flex items-start mb-4">
              <div className="bg-rose-100 p-2 rounded-full mr-4">
                <FiInfo className="text-rose-500" size={20} />
              </div>
              <div>
                <h3 className="font-semibold text-gray-800 mb-1">メンテナンス情報</h3>
                <p className="text-gray-600">{maintenanceInfo.reason}</p>
              </div>
            </div>
            
            <div className="flex items-start mb-4">
              <div className="bg-blue-100 p-2 rounded-full mr-4">
                <FiClock className="text-blue-500" size={20} />
              </div>
              <div>
                <h3 className="font-semibold text-gray-800 mb-1">終了予定</h3>
                <p className="text-gray-600">
                  {maintenanceInfo.scheduledEndTime !== '未定' 
                    ? new Date(maintenanceInfo.scheduledEndTime).toLocaleString('ja-JP', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })
                    : '未定'}
                </p>
                {countdown && (
                  <p className="mt-1 text-blue-600 font-medium">
                    {countdown}
                  </p>
                )}
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="bg-green-100 p-2 rounded-full mr-4">
                <FiMail className="text-green-500" size={20} />
              </div>
              <div>
                <h3 className="font-semibold text-gray-800 mb-1">お問い合わせ</h3>
                <p className="text-gray-600">
                  {maintenanceInfo.contact}
                </p>
              </div>
            </div>
          </div>
          
          <div className="text-center">
            <p className="text-sm text-gray-500">
              ご迷惑をおかけして申し訳ありません。<br />
              メンテナンス終了後、自動的にサイトは復旧します。
            </p>
          </div>
        </div>
      </div>
      
      {/* 背景の装飾要素 */}
      <div className="fixed top-20 left-20 w-16 h-16 bg-pink-200 rounded-full opacity-20 animate-float"></div>
      <div className="fixed bottom-20 right-20 w-24 h-24 bg-rose-200 rounded-full opacity-20 animate-float-delay"></div>
      <div className="fixed top-1/3 right-1/4 w-12 h-12 bg-blue-200 rounded-full opacity-20 animate-float-delay-2"></div>
    </div>
  );
};

export default MaintenancePage; 