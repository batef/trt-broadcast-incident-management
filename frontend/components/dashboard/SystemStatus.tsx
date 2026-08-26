import { CheckCircle2, Radio, Server } from 'lucide-react'

// ÖNEMLİ: Backend'de yayın kanalı / sistem sağlığı verisi tutan
// hiçbir endpoint veya entity yok. Bu panel tamamen görsel/demo amaçlıdır
// ve "Demo veri" etiketiyle açıkça işaretlenmiştir — gerçek bir izleme
// sistemine bağlı değildir.
const mockSystems = [
  { name: 'Ana Yayın Kanalı', detail: 'HD-SDI çıkış', status: 'ok' as const },
  { name: 'Yedek Yayın Kanalı', detail: 'Otomatik devreye alma', status: 'ok' as const },
  { name: 'Stüdyo Ses Sistemi', detail: 'Bakım planlandı', status: 'warn' as const },
]

export function SystemStatus() {
  return (
    <div className="panel full-panel">
      <div className="panel-head">
        <div>
          <h2>Canlı Sistem Durumu</h2>
          <p>Operasyonel sağlık göstergesi</p>
        </div>
        <span className="demo-tag">Demo veri</span>
      </div>
      <div className="system-list">
        {mockSystems.map((system) => (
          <div key={system.name}>
            <div className={`system-icon ${system.status === 'warn' ? 'warning' : ''}`}>
              {system.status === 'warn' ? <Server size={15} /> : <Radio size={15} />}
            </div>
            <div>
              <strong>{system.name}</strong>
              <small>{system.detail}</small>
            </div>
            {system.status === 'ok' ? (
              <CheckCircle2 size={16} className="ok" />
            ) : (
              <span className="warn">Bakımda</span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
