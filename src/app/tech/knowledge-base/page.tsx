'use client';

import React, { useState, useRef, useEffect } from 'react';
import { 
  Search, 
  Plus, 
  BookOpen, 
  Eye, 
  Flame, 
  Clock, 
  ThumbsUp, 
  X,
  ChevronRight,
  Tag,
  User,
  AlertCircle,
  CheckCircle,
  ArrowLeft,
  Send,
  Cpu,
  Wifi,
  Monitor,
  HardDrive,
  Printer
} from 'lucide-react';

// --- Types ---
type Category = 'PRINTERS' | 'NETWORK' | 'SOFTWARE' | 'OS' | 'HARDWARE';

interface Article {
  id: string;
  title: string;
  excerpt: string;
  content: string;           // Full troubleshooting steps
  rootCause?: string;
  deviceRecommendations?: string[];
  firmwareNote?: string;
  category: Category;
  author: string;
  readTime: string;
  views: number;
  likes: number;
  date: string;
  tags?: string[];
  isVerified?: boolean;
}

// --- Mock Data ---
const ARTICLES: Article[] = [
  {
    id: '1',
    title: 'Ricoh MP 5054 - Error SC542 Reset Procedure',
    excerpt: 'Triá»‡u chá»©ng: MÃ¡y hiá»ƒn thá»‹ SC542 (Fusing Temperature Warm-up Error). Cáº§n reset service code vÃ  kiá»ƒm tra nhiá»‡t Ä‘á»™ fuser.',
    content: `## Triá»‡u chá»©ng
MÃ¡y in hiá»ƒn thá»‹ lá»—i **SC542** (Fusing Temperature Warm-up Error). MÃ¡y khÃ´ng thá»ƒ khá»Ÿi Ä‘á»™ng bÃ¬nh thÆ°á»ng.

## NguyÃªn nhÃ¢n
Thermistor cá»§a fuser unit bá»‹ há»ng hoáº·c káº¿t ná»‘i lá»ng láº»o, khiáº¿n mÃ¡y khÃ´ng thá»ƒ Ä‘á»c nhiá»‡t Ä‘á»™ gia nhiá»‡t chÃ­nh xÃ¡c.

## CÃ¡c bÆ°á»›c xá»­ lÃ½

### BÆ°á»›c 1: Reset SC code
1. Táº¯t mÃ¡y hoÃ n toÃ n (cÃ´ng táº¯c chÃ­nh).
2. Giá»¯ **[0]** + **[#]** trÃªn bÃ n phÃ­m Ä‘á»“ng thá»i.
3. Trong khi giá»¯, báº­t cÃ´ng táº¯c nguá»“n â€” mÃ¡y sáº½ vÃ o **Service Mode**.
4. Nháº­p mÃ£: \`SP5-810-001\` â†’ Chá»n **Execute**.
5. Nháº­p tiáº¿p: \`SP5-810-002\` â†’ Chá»n **Execute**.
6. Táº¯t nguá»“n vÃ  khá»Ÿi Ä‘á»™ng láº¡i bÃ¬nh thÆ°á»ng.

### BÆ°á»›c 2: Kiá»ƒm tra Fuser Unit
- ThÃ¡o fuser unit, kiá»ƒm tra thermistor báº±ng Ä‘á»“ng há»“ Ä‘o Ä‘iá»‡n trá»Ÿ (~5â€“10 kÎ© á»Ÿ nhiá»‡t Ä‘á»™ phÃ²ng).
- Náº¿u há»Ÿ máº¡ch hoáº·c giÃ¡ trá»‹ báº¥t thÆ°á»ng â†’ **Thay má»›i fuser unit**.

### BÆ°á»›c 3: Kiá»ƒm tra sau reset
- Cháº¡y test print 10 tá» liÃªn tiáº¿p.
- VÃ o \`SP5-109\` Ä‘á»ƒ xem nhiá»‡t Ä‘á»™ fuser thá»±c táº¿ (má»¥c tiÃªu: 175â€“180Â°C).`,
    rootCause: 'Thermistor fuser unit lá»—i hoáº·c káº¿t ná»‘i PCU board bá»‹ lá»ng.',
    deviceRecommendations: ['Ricoh MP 4054', 'Ricoh MP 5054', 'Ricoh MP 6054'],
    firmwareNote: 'NÃªn nÃ¢ng firmware lÃªn báº£n 1.13.0 trá»Ÿ lÃªn Ä‘á»ƒ trÃ¡nh false-positive SC542.',
    category: 'PRINTERS',
    author: 'Mike Ross',
    readTime: '2 min',
    views: 1240,
    likes: 45,
    date: '2 days ago',
    tags: ['SC542', 'Fuser', 'Error Code', 'Ricoh'],
    isVerified: true
  },
  {
    id: '2',
    title: 'Windows Server 2019 - Boot Loop Troubleshooting',
    excerpt: 'Sá»­a lá»—i boot loop sau khi cáº­p nháº­t Windows. Cáº§n truy cáº­p Safe Mode Ä‘á»ƒ rollback update.',
    content: `## Triá»‡u chá»©ng
Server khá»Ÿi Ä‘á»™ng láº¡i liÃªn tá»¥c sau khi cÃ i Windows Update, khÃ´ng vÃ o Ä‘Æ°á»£c desktop.

## CÃ¡c bÆ°á»›c xá»­ lÃ½

### BÆ°á»›c 1: VÃ o Safe Mode
1. Khi mÃ¡y Ä‘ang restart, nháº¥n **F8** nhiá»u láº§n (hoáº·c giá»¯ **Shift + F8** trÃªn UEFI).
2. Chá»n **Safe Mode with Networking**.

### BÆ°á»›c 2: XÃ¡c Ä‘á»‹nh Update gÃ¢y lá»—i
\`\`\`powershell
Get-HotFix | Sort-Object InstalledOn -Descending | Select-Object -First 10
\`\`\`

### BÆ°á»›c 3: Rollback Update
\`\`\`powershell
wusa /uninstall /kb:XXXXXXX /quiet /norestart
\`\`\`
Thay \`XXXXXXX\` báº±ng KB number cá»§a update gáº§n nháº¥t.

### BÆ°á»›c 4: Náº¿u váº«n khÃ´ng vÃ o Ä‘Æ°á»£c
Sá»­ dá»¥ng Recovery Console tá»« USB bootable:
\`\`\`
bootrec /fixmbr
bootrec /fixboot
bootrec /rebuildbcd
\`\`\``,
    rootCause: 'Windows Update KB incompatible vá»›i driver RAID controller hoáº·c AV software.',
    deviceRecommendations: ['Dell PowerEdge', 'HP ProLiant', 'Lenovo ThinkSystem'],
    category: 'OS',
    author: 'Sarah Connor',
    readTime: '5 min',
    views: 890,
    likes: 120,
    date: '1 week ago',
    tags: ['Boot Loop', 'Windows Update', 'Safe Mode', 'Server'],
    isVerified: true
  },
  {
    id: '3',
    title: 'Cabling Standard T568B Diagram & Pinout',
    excerpt: 'SÆ¡ Ä‘á»“ báº¥m dÃ¢y máº¡ng chuáº©n T568B. White-Orange, Orange, White-Green, Blue...',
    content: `## Chuáº©n T568B - Thá»© tá»± báº¥m dÃ¢y

| Pin | MÃ u dÃ¢y | Chá»©c nÄƒng |
|-----|---------|-----------|
| 1 | Tráº¯ng-Cam | TX+ |
| 2 | Cam | TX- |
| 3 | Tráº¯ng-Xanh lÃ¡ | RX+ |
| 4 | Xanh dÆ°Æ¡ng | Bi-Di+ |
| 5 | Tráº¯ng-Xanh dÆ°Æ¡ng | Bi-Di- |
| 6 | Xanh lÃ¡ | RX- |
| 7 | Tráº¯ng-NÃ¢u | Bi-Di+ |
| 8 | NÃ¢u | Bi-Di- |

## LÆ°u Ã½ quan trá»ng
- **Straight-through cable**: Cáº£ 2 Ä‘áº§u báº¥m T568B â†’ ná»‘i Switch/Router vá»›i PC.
- **Crossover cable**: 1 Ä‘áº§u T568A, 1 Ä‘áº§u T568B â†’ ná»‘i Switch vá»›i Switch.
- Hiá»‡n táº¡i switch hiá»‡n Ä‘áº¡i Ä‘Ã£ há»— trá»£ **Auto-MDI/MDIX**, crossover khÃ´ng cÃ²n cáº§n thiáº¿t.

## Kiá»ƒm tra sau báº¥m
DÃ¹ng cable tester Ä‘á»ƒ verify continuity. Káº¿t quáº£ Ä‘Ãºng: LED 1-2-3-4-5-6-7-8 sÃ¡ng theo thá»© tá»±.`,
    category: 'NETWORK',
    author: 'Infra Team',
    readTime: '1 min',
    views: 2100,
    likes: 310,
    date: '3 months ago',
    tags: ['T568B', 'Cabling', 'RJ45', 'Network'],
    isVerified: true
  },
  {
    id: '4',
    title: 'Outlook 365 - "Trying to connect" loop fix',
    excerpt: 'Táº¡o profile má»›i qua Control Panel > Mail. Kiá»ƒm tra Autodiscover DNS records.',
    content: `## Triá»‡u chá»©ng
Outlook 365 hiá»ƒn thá»‹ "Trying to connect..." hoáº·c "Disconnected" liÃªn tá»¥c dÃ¹ internet hoáº¡t Ä‘á»™ng bÃ¬nh thÆ°á»ng.

## CÃ¡c bÆ°á»›c xá»­ lÃ½

### BÆ°á»›c 1: XÃ³a Credential cÅ©
1. VÃ o **Control Panel â†’ Credential Manager**.
2. XÃ³a táº¥t cáº£ entry liÃªn quan Ä‘áº¿n **Office 365** / **MicrosoftOffice**.
3. Khá»Ÿi Ä‘á»™ng láº¡i Outlook.

### BÆ°á»›c 2: Táº¡o Profile má»›i
1. **Control Panel â†’ Mail â†’ Show Profiles â†’ Add**.
2. Äáº·t tÃªn profile má»›i, thÃªm láº¡i account.
3. Chá»n "Always use this profile" cho profile má»›i.

### BÆ°á»›c 3: Kiá»ƒm tra Autodiscover DNS
\`\`\`
nslookup autodiscover.yourdomain.com
\`\`\`
Káº¿t quáº£ pháº£i trá» vá» Office 365 endpoint: \`autodiscover.outlook.com\`.

### BÆ°á»›c 4: Registry fix (náº¿u váº«n lá»—i)
\`\`\`powershell
Set-ItemProperty -Path "HKCU:\\Software\\Microsoft\\Office\\16.0\\Outlook\\AutoDiscover" -Name "ExcludeLastKnownGoodURL" -Value 1
\`\`\``,
    rootCause: 'Credential cache há»ng hoáº·c Autodiscover DNS record chá»‰ vá» endpoint sai.',
    deviceRecommendations: ['Office 365 E3/E5', 'Exchange Online'],
    category: 'SOFTWARE',
    author: 'Alex Tech',
    readTime: '3 min',
    views: 540,
    likes: 22,
    date: 'Yesterday',
    tags: ['Outlook', 'Office 365', 'Autodiscover', 'Email'],
    isVerified: false
  },
  {
    id: '5',
    title: 'Kyocera TASKalfa - Drum Unit Replacement',
    excerpt: 'Má»Ÿ náº¯p trÆ°á»›c, má»Ÿ khÃ³a cáº§n cyan. KÃ©o nháº¹ drum unit ra, trÃ¡nh Ã¡nh sÃ¡ng trá»±c tiáº¿p.',
    content: `## Khi nÃ o cáº§n thay Drum Unit?
- Äáº¿m trang Ä‘áº¡t giá»›i háº¡n (kiá»ƒm tra táº¡i SP Mode â†’ Drum Counter).
- Báº£n in xuáº¥t hiá»‡n sá»c dá»c, má» khÃ´ng Ä‘á»u.

## Quy trÃ¬nh thay tháº¿

### BÆ°á»›c 1: Chuáº©n bá»‹
- Táº¯t mÃ¡y vÃ  Ä‘á»ƒ nguá»™i 15 phÃºt.
- DÃ¹ng gÄƒng tay Ä‘á»ƒ trÃ¡nh Ä‘á»ƒ láº¡i dáº¥u vÃ¢n tay trÃªn drum.

### BÆ°á»›c 2: ThÃ¡o Drum cÅ©
1. Má»Ÿ **náº¯p trÆ°á»›c (Front Cover)**.
2. KÃ©o nháº¹ **Handle mÃ u xanh** cá»§a drum unit cáº§n thay.
3. KÃ©o tháº³ng ra ngoÃ i â€” **khÃ´ng nghiÃªng**.
4. Äáº·t vÃ o tÃºi Ä‘en chuyÃªn dá»¥ng, trÃ¡nh Ã¡nh sÃ¡ng.

### BÆ°á»›c 3: Láº¯p Drum má»›i
1. Má»Ÿ há»™p drum má»›i, giá»¯ nguyÃªn táº¥m báº£o vá»‡ Ä‘áº¿n khi láº¯p vÃ o mÃ¡y.
2. TrÆ°á»£t drum vÃ o Ä‘Ãºng rÃ£nh cho Ä‘áº¿n khi nghe tiáº¿ng **click**.
3. ÄÃ³ng náº¯p trÆ°á»›c.

### BÆ°á»›c 4: Reset Drum Counter
1. VÃ o **Service Mode** â†’ \`Maintenance â†’ Drum Counter â†’ Reset\`.
2. XÃ¡c nháº­n reset.`,
    rootCause: 'Drum unit háº¿t tuá»•i thá» (thÆ°á»ng 100,000â€“200,000 trang tÃ¹y model).',
    deviceRecommendations: ['Kyocera TASKalfa 3252ci', 'Kyocera TASKalfa 4002i', 'Kyocera TASKalfa 5002i'],
    firmwareNote: 'Kiá»ƒm tra firmware phiÃªn báº£n â‰¥ 3.0 Ä‘á»ƒ há»— trá»£ auto drum counter tracking.',
    category: 'PRINTERS',
    author: 'John Doe',
    readTime: '8 min',
    views: 320,
    likes: 15,
    date: '5 days ago',
    tags: ['Drum Unit', 'Kyocera', 'Replacement', 'Maintenance'],
    isVerified: true
  },
  {
    id: '6',
    title: 'VPN Client - Error 619 Resolution',
    excerpt: 'Kiá»ƒm tra cÃ i Ä‘áº·t firewall cho phÃ©p GRE protocol. XÃ¡c minh authentication settings.',
    content: `## Triá»‡u chá»©ng
VPN client bÃ¡o lá»—i **Error 619: A connection to the remote computer could not be established** khi káº¿t ná»‘i PPTP/L2TP.

## NguyÃªn nhÃ¢n phá»• biáº¿n
1. Firewall cháº·n **GRE Protocol (IP Protocol 47)**.
2. Router khÃ´ng há»— trá»£ **VPN Passthrough**.
3. Sai thÃ´ng tin xÃ¡c thá»±c (username/password).

## CÃ¡c bÆ°á»›c xá»­ lÃ½

### Cho PPTP VPN
1. VÃ o **Router Admin â†’ Firewall â†’ VPN Passthrough**.
2. Báº­t **PPTP Passthrough** vÃ  **L2TP Passthrough**.
3. Má»Ÿ port **1723 TCP** vÃ  cho phÃ©p **GRE (Protocol 47)**.

### Cho Windows Firewall
\`\`\`powershell
netsh advfirewall firewall add rule name="GRE Protocol" protocol=47 dir=in action=allow
netsh advfirewall firewall add rule name="PPTP" protocol=TCP localport=1723 dir=in action=allow
\`\`\`

### Kiá»ƒm tra Registry (Windows 10/11)
\`\`\`
HKLM\\System\\CurrentControlSet\\Services\\RasMan\\Parameters
â†’ ProhibitIpSec = 1 (náº¿u dÃ¹ng L2TP khÃ´ng cÃ³ certificate)
\`\`\``,
    rootCause: 'Firewall hoáº·c router cháº·n GRE protocol cáº§n thiáº¿t cho PPTP tunnel.',
    deviceRecommendations: ['Cisco RV series', 'Mikrotik RouterOS', 'Fortinet FortiGate'],
    category: 'NETWORK',
    author: 'Mike Ross',
    readTime: '4 min',
    views: 1100,
    likes: 89,
    date: '2 weeks ago',
    tags: ['VPN', 'Error 619', 'PPTP', 'Firewall', 'GRE'],
    isVerified: true
  }
];

const FILTERS = ['All', 'Printers', 'Network', 'Software', 'OS', 'Hardware'];

const CATEGORY_ICON: Record<Category, React.FC<{className?: string}>> = {
  PRINTERS: ({className}) => <Printer className={className} />,
  NETWORK: ({className}) => <Wifi className={className} />,
  SOFTWARE: ({className}) => <Monitor className={className} />,
  OS: ({className}) => <Cpu className={className} />,
  HARDWARE: ({className}) => <HardDrive className={className} />,
};

// ============================================================
// ArticleDetailModal
// ============================================================
interface ArticleDetailModalProps {
  article: Article | null;
  onClose: () => void;
  onLike: (id: string) => void;
}

const ArticleDetailModal = ({ article, onClose, onLike }: ArticleDetailModalProps) => {
  const isOpen = article !== null;

  // Simple markdown renderer
  const renderContent = (md: string) => {
    const lines = md.split('\n');
    const elements: React.ReactNode[] = [];
    let key = 0;
    let inTable = false;
    const tableRows: string[][] = [];

    const flushTable = () => {
      if (tableRows.length === 0) return;
      const header = tableRows[0];
      const rows = tableRows.slice(2);
      elements.push(
        <div key={key++} className="overflow-x-auto my-4">
          <table className="min-w-full text-sm border-collapse">
            <thead>
              <tr className="bg-slate-100">
                {header.map((cell, i) => <th key={i} className="px-3 py-2 text-left font-semibold border border-slate-200 text-slate-700">{cell.trim()}</th>)}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, ri) => (
                <tr key={ri} className={ri % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                  {row.map((cell, ci) => <td key={ci} className="px-3 py-2 border border-slate-200 text-slate-600">{cell.trim()}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      tableRows.length = 0;
      inTable = false;
    };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.startsWith('|')) {
        inTable = true;
        tableRows.push(line.split('|').filter((_, idx, arr) => idx > 0 && idx < arr.length - 1));
        continue;
      }
      if (inTable) flushTable();
      if (line.startsWith('## ')) {
        elements.push(<h2 key={key++} className="text-lg font-bold text-slate-900 mt-6 mb-2 pb-1 border-b border-slate-100">{line.slice(3)}</h2>);
      } else if (line.startsWith('### ')) {
        elements.push(<h3 key={key++} className="text-base font-semibold text-slate-800 mt-4 mb-1">{line.slice(4)}</h3>);
      } else if (line.startsWith('```')) {
        const codeLines: string[] = [];
        i++;
        while (i < lines.length && !lines[i].startsWith('```')) {
          codeLines.push(lines[i]);
          i++;
        }
        elements.push(
          <pre key={key++} className="bg-slate-900 text-green-400 rounded-xl p-4 text-xs font-mono overflow-x-auto my-3 leading-relaxed">
            {codeLines.join('\n')}
          </pre>
        );
      } else if (line.match(/^\d+\./)) {
        elements.push(<div key={key++} className="flex gap-2 mb-1"><span className="text-blue-600 font-bold text-sm min-w-[1.25rem]">{line.match(/^(\d+)\./)?.[1]}.</span><span className="text-sm text-slate-600">{line.replace(/^\d+\.\s*/, '')}</span></div>);
      } else if (line.startsWith('- ')) {
        elements.push(<div key={key++} className="flex gap-2 mb-1"><span className="text-slate-400 mt-1">â€¢</span><span className="text-sm text-slate-600">{line.slice(2)}</span></div>);
      } else if (line.trim() !== '') {
        // Handle bold inline
        const parts = line.split(/(\*\*[^*]+\*\*)/g);
        elements.push(
          <p key={key++} className="text-sm text-slate-600 mb-2 leading-relaxed">
            {parts.map((p, i) => p.startsWith('**') ? <strong key={i} className="font-semibold text-slate-800">{p.slice(2, -2)}</strong> : p)}
          </p>
        );
      } else {
        elements.push(<div key={key++} className="h-2" />);
      }
    }
    if (inTable) flushTable();
    return elements;
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex items-start justify-end transition-all duration-300 ${
        isOpen ? 'visible' : 'invisible'
      }`}
    >
      <div
        className={`absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`}
        onClick={onClose}
      />
      <div
        className={`relative bg-white h-full w-full max-w-2xl shadow-2xl flex flex-col transition-all duration-300 ${
          isOpen ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
        }`}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-100 bg-white sticky top-0 z-10">
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-500">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-blue-600 uppercase tracking-wider">{article?.category}</p>
          </div>
          {article?.isVerified && (
            <div className="flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full text-xs font-bold">
              <CheckCircle className="w-3.5 h-3.5" />
              Verified
            </div>
          )}
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-500">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6">
            {/* Title */}
            <h1 className="text-2xl font-bold text-slate-900 mb-4 leading-snug">{article?.title}</h1>

            {/* Meta */}
            <div className="flex flex-wrap items-center gap-4 mb-6 pb-6 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-xs font-bold">
                  {article?.author.charAt(0)}
                </div>
                <span className="text-sm font-medium text-slate-700">{article?.author}</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-400 text-xs font-medium">
                <Clock className="w-3.5 h-3.5" />
                {article?.readTime} read
              </div>
              <div className="flex items-center gap-1.5 text-slate-400 text-xs font-medium">
                <Eye className="w-3.5 h-3.5" />
                {article?.views.toLocaleString()} views
              </div>
              <div className="flex items-center gap-1.5 text-slate-400 text-xs font-medium">
                <User className="w-3.5 h-3.5" />
                {article?.date}
              </div>
            </div>

            {/* Tags */}
            {article?.tags && article.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-6">
                {article.tags.map(tag => (
                  <span key={tag} className="flex items-center gap-1 text-xs font-medium px-2.5 py-1 bg-slate-100 text-slate-600 rounded-full">
                    <Tag className="w-3 h-3" />
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Article Body */}
            <div className="prose-custom">
              {article && renderContent(article.content)}
            </div>

            {/* Root Cause */}
            {article?.rootCause && (
              <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-xl flex gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-amber-700 mb-1">NguyÃªn nhÃ¢n gá»‘c rá»…</p>
                  <p className="text-sm text-amber-800">{article.rootCause}</p>
                </div>
              </div>
            )}

            {/* Device Recommendations */}
            {article?.deviceRecommendations && article.deviceRecommendations.length > 0 && (
              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                <p className="text-xs font-bold text-blue-700 mb-2">Ãp dá»¥ng cho thiáº¿t bá»‹</p>
                <div className="flex flex-wrap gap-2">
                  {article.deviceRecommendations.map(device => (
                    <span key={device} className="text-xs font-medium px-2.5 py-1 bg-white border border-blue-200 text-blue-700 rounded-full">
                      {device}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Firmware Note */}
            {article?.firmwareNote && (
              <div className="mt-4 p-4 bg-purple-50 border border-purple-200 rounded-xl">
                <p className="text-xs font-bold text-purple-700 mb-1">LÆ°u Ã½ Firmware</p>
                <p className="text-sm text-purple-800">{article.firmwareNote}</p>
              </div>
            )}

            {/* Bottom spacing */}
            <div className="h-8" />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-100 bg-white flex items-center justify-between">
          <button
            onClick={() => article && onLike(article.id)}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-blue-50 hover:text-blue-600 text-slate-600 rounded-lg text-sm font-medium transition-all"
          >
            <ThumbsUp className="w-4 h-4" />
            Há»¯u Ã­ch ({article?.likes})
          </button>
          <div className="flex items-center gap-2 text-slate-400 text-xs">
            <CheckCircle className="w-4 h-4 text-emerald-500" />
            <span>ÄÆ°á»£c kiá»ƒm duyá»‡t bá»Ÿi ká»¹ thuáº­t viÃªn cáº¥p cao</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================
// ShareKnowledgeModal
// ============================================================
interface ShareKnowledgeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (article: Omit<Article, 'id' | 'views' | 'likes' | 'date' | 'isVerified'>) => void;
}

const ShareKnowledgeModal = ({ isOpen, onClose, onSubmit }: ShareKnowledgeModalProps) => {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<Category>('PRINTERS');
  const [content, setContent] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    if (!title.trim() || !content.trim()) return;
    setIsSubmitting(true);
    setTimeout(() => {
      onSubmit({
        title,
        excerpt: content.slice(0, 120) + '...',
        content,
        category,
        author: 'Báº¡n (chá» duyá»‡t)',
        readTime: `${Math.max(1, Math.ceil(content.split(' ').length / 200))} min`,
        tags: tagsInput.split(',').map(t => t.trim()).filter(Boolean),
      });
      setIsSubmitting(false);
      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
        setTitle(''); setContent(''); setTagsInput('');
        onClose();
      }, 1800);
    }, 900);
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-300 ${
        isOpen ? 'visible opacity-100' : 'invisible opacity-0'
      }`}
    >
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
      />
      <div
        className={`relative bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden transition-all duration-300 delay-75 ${
          isOpen ? 'scale-100 opacity-100 translate-y-0' : 'scale-95 opacity-0 translate-y-4'
        }`}
      >
        <div className="flex justify-between items-center p-6 border-b border-gray-100">
          <h3 className="text-lg font-bold text-gray-900">ÄÃ³ng gÃ³p kiáº¿n thá»©c</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-500 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {submitted ? (
          <div className="p-12 flex flex-col items-center justify-center gap-4">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-emerald-600" />
            </div>
            <p className="text-lg font-bold text-gray-900">Gá»­i thÃ nh cÃ´ng!</p>
            <p className="text-sm text-gray-500 text-center">BÃ i viáº¿t cá»§a báº¡n Ä‘ang chá» kiá»ƒm duyá»‡t vÃ  sáº½ xuáº¥t hiá»‡n trong danh sÃ¡ch.</p>
          </div>
        ) : (
          <>
            <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-gray-700">TiÃªu Ä‘á» bÃ i viáº¿t *</label>
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="VD: Ricoh MP 5054 - CÃ¡ch reset SC542"
                  className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-gray-700">Danh má»¥c *</label>
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value as Category)}
                    className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all appearance-none cursor-pointer"
                  >
                    <option value="PRINTERS">MÃ¡y in</option>
                    <option value="NETWORK">Network</option>
                    <option value="SOFTWARE">Software</option>
                    <option value="OS">OS</option>
                    <option value="HARDWARE">Hardware</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-gray-700">Tags (cÃ¡ch nhau dáº¥u pháº©y)</label>
                  <input
                    type="text"
                    value={tagsInput}
                    onChange={e => setTagsInput(e.target.value)}
                    placeholder="VD: Ricoh, SC542, Fuser"
                    className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-bold text-gray-700">Ná»™i dung / CÃ¡c bÆ°á»›c xá»­ lÃ½ *</label>
                <textarea
                  rows={8}
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  placeholder="## Triá»‡u chá»©ng&#10;MÃ´ táº£ váº¥n Ä‘á»...&#10;&#10;## CÃ¡c bÆ°á»›c xá»­ lÃ½&#10;1. BÆ°á»›c Ä‘áº§u tiÃªn...&#10;2. BÆ°á»›c thá»© hai..."
                  className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-y font-mono"
                />
                <p className="text-[10px] text-gray-400 text-right">Markdown Ä‘Æ°á»£c há»— trá»£ â€¢ {content.length} kÃ½ tá»±</p>
              </div>
            </div>

            <div className="p-6 bg-gray-50 flex justify-between items-center">
              <p className="text-xs text-gray-400">BÃ i viáº¿t sáº½ Ä‘Æ°á»£c kiá»ƒm duyá»‡t trÆ°á»›c khi xuáº¥t báº£n.</p>
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
                >
                  Há»§y
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={!title.trim() || !content.trim() || isSubmitting}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  Gá»­i bÃ i viáº¿t
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

// ============================================================
// Main Page
// ============================================================
export default function KnowledgeBasePage() {
  const [activeFilter, setActiveFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [articles, setArticles] = useState<Article[]>(ARTICLES);

  const getCategoryStyle = (category: Category) => {
    switch (category) {
      case 'PRINTERS': return 'bg-orange-50 text-orange-600';
      case 'NETWORK': return 'bg-blue-50 text-blue-600';
      case 'SOFTWARE': return 'bg-slate-100 text-slate-600';
      case 'OS': return 'bg-purple-50 text-purple-600';
      case 'HARDWARE': return 'bg-emerald-50 text-emerald-600';
      default: return 'bg-gray-50 text-gray-600';
    }
  };

  const getCategoryIconStyle = (category: Category) => {
    switch (category) {
      case 'PRINTERS': return 'bg-orange-50 text-orange-500';
      case 'NETWORK': return 'bg-blue-50 text-blue-500';
      case 'SOFTWARE': return 'bg-slate-100 text-slate-500';
      case 'OS': return 'bg-purple-50 text-purple-500';
      case 'HARDWARE': return 'bg-emerald-50 text-emerald-500';
      default: return 'bg-gray-50 text-gray-500';
    }
  };

  const filteredArticles = articles.filter(article => {
    const matchesFilter = activeFilter === 'All' || article.category.toUpperCase() === activeFilter.toUpperCase();
    const matchesSearch = article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (article.tags ?? []).some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesFilter && matchesSearch;
  });

  const handleLike = (id: string) => {
    setArticles(prev => prev.map(a => a.id === id ? { ...a, likes: a.likes + 1 } : a));
    // Update selected article too
    setSelectedArticle(prev => prev && prev.id === id ? { ...prev, likes: prev.likes + 1 } : prev);
  };

  const handleNewArticle = (newArticle: Omit<Article, 'id' | 'views' | 'likes' | 'date' | 'isVerified'>) => {
    const article: Article = {
      ...newArticle,
      id: String(Date.now()),
      views: 0,
      likes: 0,
      date: 'Vá»«a Ä‘Äƒng',
      isVerified: false,
    };
    setArticles(prev => [article, ...prev]);
  };

  const totalViews = articles.reduce((sum, a) => sum + a.views, 0);
  const topContributor = Object.entries(
    articles.reduce((acc, a) => ({ ...acc, [a.author]: (acc[a.author] || 0) + 1 }), {} as Record<string, number>)
  ).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'N/A';

  return (
    <div className="h-screen bg-gray-50 flex flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto p-6 md:p-8">
        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Knowledge Base</h1>
            <p className="text-gray-500 mt-1">HÆ°á»›ng dáº«n, tÃ i liá»‡u vÃ  tips tá»« cá»™ng Ä‘á»“ng ká»¹ thuáº­t viÃªn</p>
          </div>
          <button
            onClick={() => setIsShareModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold shadow-sm hover:bg-blue-700 active:bg-blue-800 transition-colors"
          >
            <Plus className="w-4 h-4" />
            ÄÃ³ng gÃ³p bÃ i viáº¿t
          </button>
        </div>

        {/* STATS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Tá»•ng bÃ i viáº¿t</p>
              <h2 className="text-3xl font-bold text-gray-900">{articles.length}</h2>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
              <BookOpen className="w-5 h-5" />
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Tá»•ng lÆ°á»£t xem</p>
              <h2 className="text-3xl font-bold text-gray-900">{(totalViews / 1000).toFixed(1)}k</h2>
            </div>
            <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center text-green-600">
              <Eye className="w-5 h-5" />
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">ÄÃ³ng gÃ³p nhiá»u nháº¥t</p>
              <h2 className="text-xl font-bold text-gray-900">{topContributor}</h2>
            </div>
            <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-orange-600">
              <Flame className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* SEARCH & FILTERS */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="flex-1 relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
            <input
              type="text"
              placeholder="TÃ¬m mÃ£ lá»—i, model thiáº¿t bá»‹, hoáº·c tá»« khÃ³a..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm"
            />
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0">
            {FILTERS.map(filter => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                  activeFilter === filter
                    ? 'bg-gray-900 text-white shadow-md'
                    : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        {/* ARTICLES GRID */}
        {filteredArticles.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <BookOpen className="w-12 h-12 mb-4 opacity-30" />
            <p className="font-medium">KhÃ´ng tÃ¬m tháº¥y bÃ i viáº¿t nÃ o</p>
            <p className="text-sm mt-1">Thá»­ tá»« khÃ³a khÃ¡c hoáº·c Ä‘Ã³ng gÃ³p bÃ i viáº¿t má»›i</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredArticles.map(article => {
              const CategoryIcon = CATEGORY_ICON[article.category];
              return (
                <div
                  key={article.id}
                  onClick={() => setSelectedArticle(article)}
                  className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-blue-200 hover:-translate-y-1 transition-all duration-300 group cursor-pointer flex flex-col h-full"
                >
                  {/* Card Header */}
                  <div className="flex justify-between items-center mb-4">
                    <span className={`text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wide ${getCategoryStyle(article.category)}`}>
                      {article.category}
                    </span>
                    <div className="flex items-center gap-2">
                      {article.isVerified && (
                        <CheckCircle className="w-4 h-4 text-emerald-500" />
                      )}
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${getCategoryIconStyle(article.category)}`}>
                        <CategoryIcon className="w-4 h-4" />
                      </div>
                    </div>
                  </div>

                  {/* Content */}
                  <h3 className="text-base font-bold text-gray-900 mb-2 leading-tight group-hover:text-blue-600 transition-colors">
                    {article.title}
                  </h3>
                  <p className="text-sm text-gray-500 mb-4 line-clamp-2">{article.excerpt}</p>

                  {/* Tags preview */}
                  {article.tags && article.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-4">
                      {article.tags.slice(0, 3).map(tag => (
                        <span key={tag} className="text-[10px] px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full font-medium">
                          {tag}
                        </span>
                      ))}
                      {article.tags.length > 3 && (
                        <span className="text-[10px] px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full font-medium">
                          +{article.tags.length - 3}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Footer */}
                  <div className="mt-auto flex items-center justify-between border-t border-gray-50 pt-4">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 text-xs font-bold">
                        {article.author.charAt(0)}
                      </div>
                      <span className="text-xs font-medium text-gray-600">{article.author}</span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-gray-400 font-medium">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {article.readTime}
                      </div>
                      <div className="flex items-center gap-1">
                        <ThumbsUp className="w-3.5 h-3.5" />
                        {article.likes}
                      </div>
                    </div>
                  </div>

                  {/* Read more indicator */}
                  <div className="mt-3 flex items-center gap-1 text-blue-500 text-xs font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                    Xem chi tiáº¿t <ChevronRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* MODALS */}
      <ArticleDetailModal
        article={selectedArticle}
        onClose={() => setSelectedArticle(null)}
        onLike={handleLike}
      />
      <ShareKnowledgeModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        onSubmit={handleNewArticle}
      />
    </div>
  );
}