
import React from 'react';
import {profile,table,row,label,value} from './ProfileCard.module.css';

// ProfileCard は外部から `profile` オブジェクトを受け取ります。
// 期待される shape: { name, faculty, hobby, favoriteArtist }
// profile prop が渡されない場合はフォールバック値を表示します。
export function ProfileCard({ profile: p = {} }) {
    // 安全なデストラクチャリングとデフォルト値
    const {
        name = '—',
        faculty = '—',
        hobby = '—',
        favoriteArtist = '—',
    } = p || {};

    return (
        <div className={profile}>
            <dl className={table}>
                <div className={row}>
                    <dt className={label}>名前</dt>
                    <dd className={value}>{name}</dd>
                </div>
                <div className={row}>
                    <dt className={label}>学部</dt>
                    <dd className={value}>{faculty}</dd>
                </div>
                <div className={row}>
                    <dt className={label}>趣味</dt>
                    <dd className={value}>{hobby}</dd>
                </div>
                <div className={row}>
                    <dt className={label}>好きなアーティスト</dt>
                    <dd className={value}>{favoriteArtist}</dd>
                </div>
            </dl>
        </div>
    );
}
