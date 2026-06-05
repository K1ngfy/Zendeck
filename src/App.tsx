/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus, 
  Trash2, 
  Download, 
  Upload,
  GripVertical, 
  Monitor, 
  Code, 
  Settings, 
  ChevronRight,
  ShieldCheck,
  FileText,
  Eye,
  Sparkles,
  Copy,
  Check,
  X,
  BookOpen,
  Terminal,
  RotateCcw,
  Palette,
  ChevronDown,
  Settings2,
  Image,
  Image as ImageIcon,
  Library,
  PanelLeft,
  PanelRight,
  Menu,
  Folder
} from 'lucide-react';
import { ReactSortable } from 'react-sortablejs';
import { v4 as uuidv4 } from 'uuid';
import { motion, AnimatePresence } from 'motion/react';
import SettingsModal from './components/SettingsModal';
import AgentModal from './components/AgentModal';
import LogoManagerModal, { LogoConfig } from './components/LogoManagerModal';
import AssetLibraryModal from './components/AssetLibraryModal';

// --- Constants & Types ---

interface Slide {
  id: string;
  title: string;
  code: string;
  isDefault?: boolean;
  templateType?: 'cover' | 'content';
}

interface ProjectData {
  id: string;
  projectName: string;
  themeId?: string;
  activeLogo?: LogoConfig;
  savedLogos?: string[];
  logoUrl?: string; // legacy support
  slides: Slide[];
}

const STORAGE_KEY = 'zendeck_project_data';

function getThemeClasses(themeId: string, type: 'bg' | 'title' | 'text' | 'cardBg' | 'cardText' | 'border' | 'cardRound' | 'buttonBg' | 'buttonText') {
  switch (themeId) {
    case 'dark-matter':
      return {
        bg: 'bg-transparent',
        title: 'text-white',
        text: 'text-slate-400',
        cardBg: 'bg-slate-800',
        cardText: 'text-slate-200',
        border: 'border-slate-700',
        cardRound: 'rounded-3xl',
        buttonBg: 'bg-blue-900 border-blue-800',
        buttonText: 'text-blue-100'
      }[type];
    case 'glass-ocean':
      return {
        bg: 'bg-transparent',
        title: 'text-cyan-900',
        text: 'text-cyan-800',
        cardBg: 'bg-white/40 backdrop-blur-md',
        cardText: 'text-cyan-900',
        border: 'border-white/50',
        cardRound: 'rounded-3xl',
        buttonBg: 'bg-cyan-100/50',
        buttonText: 'text-cyan-900'
      }[type];
    case 'glass-rose':
      return {
        bg: 'bg-transparent',
        title: 'text-rose-900',
        text: 'text-rose-800',
        cardBg: 'bg-white/40 backdrop-blur-md',
        cardText: 'text-rose-900',
        border: 'border-white/50',
        cardRound: 'rounded-3xl',
        buttonBg: 'bg-rose-100/50',
        buttonText: 'text-rose-900'
      }[type];
    case 'cyberpunk':
      return {
        bg: 'bg-transparent',
        title: 'text-fuchsia-400 drop-shadow-[0_0_15px_rgba(232,121,249,0.8)]',
        text: 'text-fuchsia-300',
        cardBg: 'bg-zinc-950',
        cardText: 'text-fuchsia-300',
        border: 'border-fuchsia-500/50',
        cardRound: 'rounded-none',
        buttonBg: 'bg-fuchsia-900/30',
        buttonText: 'text-fuchsia-200'
      }[type];
    case 'aurora':
      return {
        bg: 'bg-transparent',
        title: 'text-white drop-shadow-md',
        text: 'text-white/90',
        cardBg: 'bg-white/10 backdrop-blur-md',
        cardText: 'text-white',
        border: 'border-white/20',
        cardRound: 'rounded-3xl shadow-2xl',
        buttonBg: 'bg-white/20 backdrop-blur-md',
        buttonText: 'text-white'
      }[type];
    case 'sunset':
      return {
        bg: 'bg-transparent', 
        title: 'text-white drop-shadow-md',
        text: 'text-white/90',
        cardBg: 'bg-white/20 backdrop-blur-md',
        cardText: 'text-white',
        border: 'border-white/20',
        cardRound: 'rounded-3xl shadow-xl shadow-orange-500/20',
        buttonBg: 'bg-white/30 backdrop-blur-md',
        buttonText: 'text-white'
      }[type];
    case 'hacker':
      return {
        bg: 'bg-transparent',
        title: 'text-green-500 font-mono tracking-widest',
        text: 'text-green-500/80 font-mono',
        cardBg: 'bg-black',
        cardText: 'text-green-400 font-mono',
        border: 'border-green-500/50',
        cardRound: 'rounded-none',
        buttonBg: 'bg-green-950',
        buttonText: 'text-green-400 font-mono'
      }[type];
    case 'lavender':
      return {
        bg: 'bg-transparent',
        title: 'text-purple-900',
        text: 'text-purple-700',
        cardBg: 'bg-white/60 backdrop-blur-md',
        cardText: 'text-purple-900',
        border: 'border-purple-200/50',
        cardRound: 'rounded-3xl shadow-xl shadow-purple-500/10',
        buttonBg: 'bg-purple-100/50 backdrop-blur-md',
        buttonText: 'text-purple-800'
      }[type];
    case 'midnight-blue':
      return {
        bg: 'bg-transparent',
        title: 'text-white',
        text: 'text-slate-300',
        cardBg: 'bg-slate-800/60 backdrop-blur-md',
        cardText: 'text-slate-100',
        border: 'border-slate-700',
        cardRound: 'rounded-3xl shadow-2xl',
        buttonBg: 'bg-slate-700/60 backdrop-blur-md',
        buttonText: 'text-indigo-200'
      }[type];
    case 'neon-city':
      return {
        bg: 'bg-transparent',
        title: 'text-pink-500 drop-shadow-[0_0_8px_rgba(236,72,153,0.8)]',
        text: 'text-cyan-400',
        cardBg: 'bg-zinc-900',
        cardText: 'text-pink-400',
        border: 'border-pink-500/50',
        cardRound: 'rounded-xl',
        buttonBg: 'bg-cyan-900/30 border-cyan-500/50',
        buttonText: 'text-cyan-400'
      }[type];
    case 'forest-glade':
      return {
        bg: 'bg-transparent',
        title: 'text-green-900',
        text: 'text-green-800',
        cardBg: 'bg-white/60 backdrop-blur-md',
        cardText: 'text-green-900',
        border: 'border-green-200',
        cardRound: 'rounded-3xl',
        buttonBg: 'bg-green-100',
        buttonText: 'text-green-800'
      }[type];
    case 'royal-gold':
      return {
        bg: 'bg-transparent',
        title: 'text-amber-400',
        text: 'text-slate-300',
        cardBg: 'bg-zinc-900/80',
        cardText: 'text-amber-500',
        border: 'border-amber-500/30',
        cardRound: 'rounded-sm',
        buttonBg: 'bg-amber-900/30 border-amber-500/50',
        buttonText: 'text-amber-400'
      }[type];
    case 'velvet-plum':
      return {
        bg: 'bg-transparent',
        title: 'text-white',
        text: 'text-purple-200',
        cardBg: 'bg-black/40 backdrop-blur-xl',
        cardText: 'text-white',
        border: 'border-purple-400/20',
        cardRound: 'rounded-2xl',
        buttonBg: 'bg-purple-900/50 border-purple-400/30',
        buttonText: 'text-purple-200'
      }[type];
    case 'ocean-depth':
      return {
        bg: 'bg-transparent',
        title: 'text-cyan-200',
        text: 'text-cyan-100/70',
        cardBg: 'bg-slate-900/50 backdrop-blur-md',
        cardText: 'text-cyan-100',
        border: 'border-cyan-800',
        cardRound: 'rounded-3xl',
        buttonBg: 'bg-cyan-950 border-cyan-800',
        buttonText: 'text-cyan-300'
      }[type];
    case 'retro-pop':
      return {
        bg: 'bg-transparent',
        title: 'text-red-600 font-black tracking-tighter',
        text: 'text-blue-800 font-bold',
        cardBg: 'bg-white',
        cardText: 'text-red-600 font-bold',
        border: 'border-4 border-black',
        cardRound: 'rounded-none shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]',
        buttonBg: 'bg-blue-500 border-2 border-black',
        buttonText: 'text-white font-bold'
      }[type];
    case 'dusty-desert':
      return {
        bg: 'bg-transparent',
        title: 'text-orange-950',
        text: 'text-orange-900/80',
        cardBg: 'bg-orange-50/80 backdrop-blur-md',
        cardText: 'text-orange-950',
        border: 'border-orange-200',
        cardRound: 'rounded-2xl',
        buttonBg: 'bg-emerald-800',
        buttonText: 'text-emerald-50'
      }[type];
    case 'frosted-mint':
      return {
        bg: 'bg-transparent',
        title: 'text-teal-900',
        text: 'text-teal-800',
        cardBg: 'bg-white/40 backdrop-blur-xl',
        cardText: 'text-teal-950',
        border: 'border-white/60',
        cardRound: 'rounded-3xl',
        buttonBg: 'bg-teal-100/60',
        buttonText: 'text-teal-900'
      }[type];
    case 'cosmic-dust':
      return {
        bg: 'bg-transparent',
        title: 'text-transparent bg-clip-text bg-gradient-to-r from-indigo-200 to-purple-200',
        text: 'text-indigo-200/80',
        cardBg: 'bg-white/5 backdrop-blur-xl',
        cardText: 'text-indigo-100',
        border: 'border-white/10',
        cardRound: 'rounded-3xl',
        buttonBg: 'bg-white/10 border-white/20',
        buttonText: 'text-indigo-200'
      }[type];
    case 'minimal-slate':
      return {
        bg: 'bg-transparent',
        title: 'text-slate-900',
        text: 'text-slate-600',
        cardBg: 'bg-white',
        cardText: 'text-slate-900',
        border: 'border-transparent',
        cardRound: 'rounded-sm shadow-md',
        buttonBg: 'bg-slate-900',
        buttonText: 'text-white'
      }[type];
    case 'apple-light':
    default:
      return {
        bg: 'bg-transparent',
        title: 'text-slate-900',
        text: 'text-slate-500',
        cardBg: 'bg-slate-50',
        cardText: 'text-slate-800',
        border: 'border-slate-100',
        cardRound: 'rounded-3xl',
        buttonBg: 'bg-blue-50',
        buttonText: 'text-blue-700'
      }[type];
  }
}

const getSlideTemplateCover = (themeId: string) => {
  const t = (type: string) => getThemeClasses(themeId, type as any);
  return `<div class="w-full h-full p-16 flex flex-col justify-center items-center text-center ${t('bg')}">
  <div class="max-w-4xl animate-fade-in-up">
    <h1 class="text-6xl font-bold mb-6 tracking-tight transition-all duration-300 hover:-translate-y-2 ${t('title')}">极简美学，纵享丝滑</h1>
    <p class="text-2xl leading-relaxed mb-12 ${t('text')}">欢迎使用 Zendeck。<br/>点击右上角的“AI 助手”获取设计提示词并开始构建专业课件。</p>
    <div class="flex gap-6 justify-center">
      <div class="px-8 py-4 ${t('buttonBg')} ${t('buttonText')} border ${t('border')} ${t('cardRound')} font-medium text-lg transition-all duration-300 hover:-translate-y-2 hover:shadow-xl delay-100 animate-fade-in-up">极简设计语言</div>
      <div class="px-8 py-4 ${t('cardBg')} ${t('cardText')} border ${t('border')} ${t('cardRound')} font-medium text-lg transition-all duration-300 hover:-translate-y-2 hover:shadow-xl delay-200 animate-fade-in-up">AI 驱动生成</div>
    </div>
  </div>
</div>`;
};

const getSlideTemplateContent = (themeId: string) => {
  const t = (type: string) => getThemeClasses(themeId, type as any);
  return `<div class="w-full h-full p-16 flex flex-col justify-center ${t('bg')}">
  <h2 class="text-5xl font-bold mb-12 tracking-tight transition-all duration-300 hover:-translate-y-2 ${t('title')} animate-fade-in-up">在这里输入标题</h2>
  <div class="grid grid-cols-2 gap-8 text-lg ${t('text')}">
    <div class="p-8 ${t('cardBg')} border ${t('border')} ${t('cardRound')} space-y-4 transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl animate-fade-in-up delay-100">
      <h3 class="text-2xl font-semibold ${t('cardText')}">核心概念 A</h3>
      <p>详细描述您的要点信息，尽量保持简短精确。</p>
    </div>
    <div class="p-8 ${t('cardBg')} border ${t('border')} ${t('cardRound')} space-y-4 transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl animate-fade-in-up delay-200">
      <h3 class="text-2xl font-semibold ${t('cardText')}">核心概念 B</h3>
      <p>这里可以填写另一部分的重要信息。</p>
    </div>
  </div>
</div>`;
};

const THEMES = [
  { id: 'apple-light', name: '极简白', previewColor: '#ffffff', cssVars: 'background: #ffffff;', promptRule: '背景使用纯白色，容器类包含 bg-white，字体使用极深的灰色(slate-900)，保留科技蓝点缀。' },
  { id: 'dark-matter', name: '暗物质', previewColor: '#0f1115', cssVars: 'background: #0f1115;', promptRule: '背景使用极暗的深灰色(bg-slate-900)，容器类包含 bg-slate-900，主标题使用白色，描述文本使用 slate-400，边框和卡片使用 slate-800，保持幽蓝色点缀。' },
  { id: 'glass-ocean', name: '毛玻璃海洋', previewColor: '#bae6fd', cssVars: 'background: linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%);', promptRule: '背景为海洋渐变，容器使用半透明模糊毛玻璃效果 (bg-white/40 backdrop-blur-xl border border-white/50 rounded-3xl)，文字颜色偏深蓝(cyan-900)。' },
  { id: 'glass-rose', name: '毛玻璃玫瑰', previewColor: '#fbcfe8', cssVars: 'background: linear-gradient(135deg, #fce7f3 0%, #fbcfe8 100%);', promptRule: '背景为粉色渐变，容器使用半透明模糊毛玻璃效果 (bg-white/40 backdrop-blur-xl border border-white/50 rounded-3xl)，文字颜色偏深红(rose-900)。' },
  { id: 'cyberpunk', name: '赛博朋克', previewColor: '#e879f9', cssVars: 'background: #09090b;', promptRule: '背景纯黑，容器类包含 bg-black，强烈的高对比度，文字使用亮荧光绿或品红，卡片使用极细的 neon 边框 (border border-fuchsia-500/50)。' },
  { id: 'aurora', name: '极光渐变', previewColor: '#4facfe', cssVars: 'background: linear-gradient(to right, #4facfe 0%, #00f2fe 100%);', promptRule: '背景为青蓝幻彩极光渐变，由于背景极亮，强烈建议卡片使用纯白背景 (bg-white) 搭配阴影 (shadow-2xl) 以突出内容。' },
  { id: 'sunset', name: '落日金橘', previewColor: '#fda085', cssVars: 'background: linear-gradient(120deg, #f6d365 0%, #fda085 100%);', promptRule: '背景为温暖的橙橘色渐变，卡片建议使用白色并带轻微圆角和柔和的橙色阴影。' },
  { id: 'hacker', name: '黑客绿', previewColor: '#22c55e', cssVars: 'background: #000000;', promptRule: '背景极黑，所有文字严格使用亮绿色(text-green-500)，带有轻微的发光效果，使用等宽字体(font-mono)，去除所有圆角(rounded-none)。' },
  { id: 'lavender', name: '薰衣草', previewColor: '#c084fc', cssVars: 'background: linear-gradient(to top, #e6e9f0 0%, #eef1f5 100%);', promptRule: '高级灰白调背景，主色调更换为优雅的紫色 (purple-600)，整体柔和低对比。' },
  { id: 'midnight-blue', name: '午夜蓝', previewColor: '#1e293b', cssVars: 'background: linear-gradient(to right, #0f2027, #203a43, #2c5364);', promptRule: '背景为极深的蓝灰色渐变，极具专业感，卡片使用深灰色(bg-slate-800/80)，文字全白或浅灰(slate-300)。' },
  { id: 'neon-city', name: '霓虹都市', previewColor: '#ec4899', cssVars: 'background: #171717;', promptRule: '背景使用几乎纯黑(zinc-900)，文字高亮使用艳粉(pink-500)和亮青(cyan-400)，边框带有霓虹光晕感。' },
  { id: 'forest-glade', name: '晨曦森林', previewColor: '#86efac', cssVars: 'background: linear-gradient(135deg, #dcfce7, #bbf7d0);', promptRule: '背景使用非常柔和的浅绿色，文字使用深墨绿(green-900)，给人清新自然的感觉。' },
  { id: 'royal-gold', name: '皇家黑金', previewColor: '#fbbf24', cssVars: 'background: #18191a;', promptRule: '背景使用哑光黑，所有强调色使用金色或明黄(amber-400)，文字主要为浅灰和金色，奢华高级感。' },
  { id: 'velvet-plum', name: '丝绒野莓', previewColor: '#9333ea', cssVars: 'background: linear-gradient(135deg, #4c1d95, #2e1065);', promptRule: '背景使用极深的紫红色，卡片使用半透明黑色，文字使用极浅的紫灰和纯白，低调奢华。' },
  { id: 'ocean-depth', name: '深海探秘', previewColor: '#0891b2', cssVars: 'background: linear-gradient(to bottom, #0f172a, #164e63);', promptRule: '背景使用深渊蓝到深青色的渐变，文字使用水蓝(cyan-200)和纯白，营造深海的高级冷峻感。' },
  { id: 'retro-pop', name: '复古波普', previewColor: '#ef4444', cssVars: 'background: #fef08a;', promptRule: '背景使用复古的明黄色(yellow-200)，卡片使用高对比的红(red-500)蓝(blue-500)粗黑边框，复古杂志排版风格。' },
  { id: 'dusty-desert', name: '沙漠绿洲', previewColor: '#d97706', cssVars: 'background: #fef3c7;', promptRule: '背景使用暖沙色(amber-50)，卡片使用陶土色(orange-900)文字，辅以仙人掌绿(emerald-700)点缀。' },
  { id: 'frosted-mint', name: '清透薄荷', previewColor: '#5eead4', cssVars: 'background: linear-gradient(135deg, #ccfbf1, #99f6e4);', promptRule: '清透的薄荷绿背景，配合大量的高斯模糊白玻璃卡片(bg-white/40 backdrop-blur)，文字青蓝。' },
  { id: 'cosmic-dust', name: '星尘变幻', previewColor: '#818cf8', cssVars: 'background: linear-gradient(135deg, #1e1b4b, #312e81, #4c1d95);', promptRule: '背景使用包含暗紫、深蓝的星空渐变，卡片使用玻璃态，文字使用星光白和浅紫(indigo-200)。' },
  { id: 'minimal-slate', name: '冷峻岩板', previewColor: '#cbd5e1', cssVars: 'background: #e2e8f0;', promptRule: '背景使用冷灰色(slate-200)，卡片使用纯白，文字使用深邃的炭黑(slate-800)，极度克制、无彩色倾向。' }
];

const getAIPromptTemplate = (themeName: string, themeRule: string, activeLogo?: LogoConfig) => `<ROLE>
你是一个顶尖的 UI/UX 设计专家和精通 Tailwind CSS 与原生 JavaScript 的前端工程师。
你的任务是为 Zendeck 平台生成专业的、具有高度设计感、交互和动效设计的单页幻灯片 (PPT) 结构代码。
</ROLE>

<USER_REQUEST>
【幻灯片主题】：[💡请在此处替换为你需要的主题，例如：零信任架构演进]
【幻灯片页数】：[💡请在此处替换为你需要生成的幻灯片页数]
【需展示的核心内容】：
1. [💡在此处列出要展示的内容要点 1]
2. [💡在此处列出要展示的内容要点 2]
3. [💡在此处列出要展示的内容要点 3]
</USER_REQUEST>

<CONTEXT_ENVIRONMENT>
1. 幻灯片尺寸固定按 16:9 比例适配，你的代码将被当做单一 DOM 子节点直接插入到应用展示容器内。
2. 【视觉主题要求】：当前主题是「${themeName}」—— ${themeRule} 务必契合该视觉规范。
${activeLogo ? `3. 【避让区要求】：页面 ${activeLogo.position.includes('left') ? '左' : '右'}${activeLogo.position.includes('top') ? '上' : '下'}角（约 250x100px 区域）已有系统固定 Logo，绝对禁止在此处放置任何可能发生重叠的文本内容或交互组件，保持纯底色留白。\n` : ''}</CONTEXT_ENVIRONMENT>

<CRITICAL_CONSTRAINTS>
在生成 HTML 代码片段时，请严格、百分之百遵守以下强制性约束条件。违反任一约束均可能导致平台运行崩溃或版式破坏：

【代码沙盒与工程约束】：
1. 绝对禁止输出外层文档结构：这段代码块会直接作为子节点被插入容器，禁止输出 <!DOCTYPE html>, <html>, <head>, <body> 等结构骨架。必须直接输出以 <div class="w-full h-full relative overflow-hidden flex..."> 为起点的完整外层容器（如果是为了响应多内容拆分的多页，允许平行输出几个同级的此类大节点）。
2. JS 严格局部作用域隔离：如果你的代码包含 <script> 逻辑实现步进或特效，所有的变量（const/let/var）和方法必须包裹在立即执行函数 IIFE 中，即 (function(){ ... })();。绝对禁止在顶层作用域声明全局变量，防止页面之间变量重名污染引起整个 PPT 系统崩溃！
3. CSS 命名空间防污染：如果你必须编写补充的内嵌 <style> 样式或自定义的 @keyframes 运动轨迹，其选择器或名称必须要带有与你的这一页特性极度相关的长前缀（如: .slide-zerotrust-title, @keyframes slide-hero-bounce-in），严禁使用如 .title 或 .card 这类基础泛型名导致全局样式相互污染！
4. 交互豁免控制：为了避免和外层的全局翻页逻辑（点击左右侧）相冲突，针对你自己实现的内部独立点击区域（如悬浮按键、折叠面板等触发载体），务必添加属性 data-interactive="true"，并且在你的对应原生的点击事件响应中，第一步执行 e.stopPropagation(); 阻止冒泡。如果设计的是用户点击交互才展示的内容，初始必须是隐藏（如 opacity-0 等静默状态），绝对不要在初始化阶段使用定时器越权自动全量展示。
5. 全局事件谨慎挂载及销毁：切勿轻易绑定全局 window 或 document 事件；若必须做全局键盘/鼠标监听，必须在此页面离开时依靠监听幻灯片专属系统事件 (如 document.addEventListener('slideleave', ...)) 来进行显式的事件移除清理。

【UI/UX 体验与设计约束】：
1. 多元排版，拒绝刻板印象：仔细分析【内容要点】的文字量和结构特点，切勿每页都千篇一律套用“大标题+上下一两行居中描述+三或四个网格卡片”的无聊排版。你要灵活应对：如果是重要突出的词汇请采用字号极大的超大字 Hero 居中占满；如果是对比情况请使用左右高对比分割排版（Split-view）；如果是流程防范请使用贯穿连贯的时间横轴。
2. 呼吸感、留白与降噪：限制单页面内的信息密度。大幅精简文字、提炼关键词，大量应用留白边距 (p-12, p-16, gap-8, gap-12)，绝对禁止生硬堆砌字数超载。如果展示内容过多，可适量调整留白，务必不能超出幻灯片边界。
3. 剧场级高质量动效：善用 Tailwind 的实用工具类为所有可见层级内容打造出场秩序和呼吸节奏。请统一使用入场动效类（如 animate-fade-in-up 或自定义），配合交错的延迟时间设定 (delay-75, delay-150, delay-300...) 实现错落有致的优美进场排演。保留元素的微交互回馈（如 transition-all duration-500 hover:-translate-y-2 hover:shadow-[...] hover:scale-105）。
</CRITICAL_CONSTRAINTS>

现在，请根据 <USER_REQUEST> 中的要求，直接开始编写输出最终完全符合上述各项开发准则的代码块。`;

const SKILL_FILE_CONTENT = `# Zendeck AI Developer Skill

## Role & Description
You are a top-tier Frontend AI Developer and UI/UX Designer specializing in the Zendeck Framework. 
Your objective is to generate single-page HTML presentation slides with Apple-style minimalist aesthetics.
These slides will be injected directly into the Zendeck system, which has a 16:9 bounding box and Tailwind CSS pre-configured.

## System Compatibility Rules (CRITICAL)
To ensure zero errors and perfect rendering in the user's system, YOU MUST STRICTLY FOLLOW THESE RULES:

1. **NO HTML Document Tags**: Do NOT output \`<!DOCTYPE html>\`, \`<html>\`, \`<head>\`, \`<body>\`, or \`<script>\` tags.
2. **Single Root Element per Slide**: Your output MUST be exactly ONE root \`<div>\` element that wraps the entire slide content. If you need to generate multiple slides, output multiple root \`<div>\` elements sequentially.
3. **Strict Tailwind CSS Styling**: Do NOT use inline styles (\`style="..."\`) or \`<style>\` blocks. ALL styling must be done using standard Tailwind CSS utility classes.
4. **No External Dependencies**: Do NOT reference external stylesheets, external JavaScript libraries, or external CDNs inside your HTML block. The system only provides Tailwind CSS.
5. **Icons Handling**: If you need icons, use pure inline SVG tags inside the HTML. Do NOT use fake custom elements (like \`<lucide-icon>\`) or external script tags.
6. **No Interactivity**: Do NOT use arbitrary Javascript (\`onclick=""\`) as the slide is purely for display.

## Content Limits & Pagination (CRITICAL)
- **Do NOT overfill the slide.** A presentation slide is not a scrolling document. 
- **Maximum Content per Slide**: 1 main title, 1 short description, and a maximum of 3-4 short bullet points or a 2-3 column grid.
- **Auto-Split**: If the provided content exceeds these limits, you MUST split it into multiple distinct slides. Output each slide as a separate, fully wrapped root \`<div>\` block.

## Layout & Dimensions
- **Aspect Ratio**: The slide is rendered in a fixed container (roughly 16:9 ratio). 
- **Root Dimensions**: The root wrapper must ALWAYS include the classes \`w-full h-full\` to occupy the full slide container.
- **Example Root Wrapper**: \`<div class="w-full h-full p-16 flex flex-col justify-center bg-white relative overflow-hidden"> ... </div>\`

## Animations & Interactions (CRITICAL FOR UX)
- **Hover States**: Apply \`transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl\` to cards, buttons, or list items to make them interactive and tactile.
- **Entrance Animations**: Use the custom \`animate-fade-in-up\` class on elements. 
- **Staggered Animations**: Use Tailwind's \`delay-100\`, \`delay-200\`, \`delay-300\` alongside \`animate-fade-in-up\` to create staggered sequential entrances for grid items.

## Design System (Apple Premium Minimalism)
- **Typography & Hierarchy**: 
  - Main Titles: Use \`text-5xl font-bold tracking-tight text-slate-900\`. 
  - Subtitles/Descriptions: Use \`text-xl text-slate-500 leading-relaxed max-w-3xl\`.
  - Content Text: Use \`text-lg text-slate-700\`.
- **Spacing (Whitespace)**: Use generous padding (e.g., \`p-12\`, \`p-16\`) and gaps (\`gap-8\`, \`gap-12\`).
- **Borders & Corners**: When creating cards, use delicate borders (\`border border-slate-100\`) and rounded corners (\`rounded-2xl\` or \`rounded-3xl\`).
- **Backgrounds**: Avoid harsh shadows. Use subtle neutral background colors like \`bg-slate-50\` or \`bg-blue-50/50\`.

## Output Formatting
- ONLY output the pure HTML code block.
- NO explanations, NO markdown surrounding the code (other than the standard \`\`\`html code block), NO pleasantries.

## Template Pattern
\`\`\`html
<div class="w-full h-full p-16 flex flex-col justify-center bg-white">
  <div class="max-w-5xl">
    <h1 class="text-5xl font-bold text-slate-900 tracking-tight mb-6">Your Title Here</h1>
    <p class="text-xl text-slate-500 leading-relaxed mb-12">An elegant description that sets the context.</p>
    
    <div class="grid grid-cols-2 gap-8">
      <div class="p-8 rounded-3xl bg-slate-50 border border-slate-100">
        <h3 class="text-2xl font-semibold mb-4 text-slate-800">Concept One</h3>
        <p class="text-slate-600">Explanation of the concept.</p>
      </div>
    </div>
  </div>
</div>
\`\`\`
`;

// --- UI Components ---

export default function App() {
  const [projectsList, setProjectsList] = useState<{id: string, title: string, lastUpdated: string, createdAt?: string}[]>([]);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [data, setData] = useState<ProjectData | null>(null);

  const [activeSlideId, setActiveSlideId] = useState<string>("");
  const [viewMode, setViewMode] = useState<'preview' | 'code'>('preview');
  const [showAssistant, setShowAssistant] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showAgentModal, setShowAgentModal] = useState(false);
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{message: string, onConfirm: () => void} | null>(null);

  const [showLogoManager, setShowLogoManager] = useState(false);
  const [showProjectsSidebar, setShowProjectsSidebar] = useState(false);
  const [expandedSection, setExpandedSection] = useState<'projects' | 'assets' | 'none'>('projects');

  const activeThemeConfig = THEMES.find(t => t.id === data?.themeId) || THEMES[0];
  const activePromptText = getAIPromptTemplate(activeThemeConfig.name, activeThemeConfig.promptRule, data?.activeLogo);

  // Initial Data Load
  useEffect(() => {
    fetch('/api/projects')
      .then(r => r.json())
      .then(list => {
        setProjectsList(list);
        if (list.length > 0 && !projectId) {
          loadProject(list[0].id);
        } else if (list.length === 0 && !projectId) {
          createNewProject();
        }
      })
      .catch(console.error);
  }, []);

  const originalDataRef = useRef<string | null>(null);

  const loadProject = async (id: string) => {
    try {
      const res = await fetch(`/api/projects/${id}`);
      const proj = await res.json();
      const newData = {
        id: proj.id,
        projectName: proj.title || proj.projectName || "未命名项目",
        themeId: proj.themeId || "apple-light",
        activeLogo: proj.activeLogo || (proj.logoUrl ? { url: proj.logoUrl, position: 'top-left' } : undefined),
        savedLogos: proj.savedLogos || (proj.logoUrl ? [proj.logoUrl] : []),
        slides: proj.slides || []
      };
      
      originalDataRef.current = JSON.stringify(newData);
      setData(newData);
      setActiveSlideId(proj.slides?.[0]?.id || "");
      setProjectId(proj.id);
    } catch (err) {
      console.error(err);
    }
  };

  const createNewProject = () => {
    const freshProj: ProjectData = {
      id: uuidv4(),
      projectName: "新培训项目",
      themeId: "apple-light",
      slides: [ { id: uuidv4(), title: "封面幻灯片", code: getSlideTemplateCover('apple-light'), isDefault: true, templateType: 'cover' } ]
    };
    
    // Creating a completely new project counts as a change, so we don't set originalDataRef to it.
    originalDataRef.current = null;
    
    setData(freshProj);
    setProjectId(freshProj.id);
    setActiveSlideId(freshProj.slides[0].id);
    
    // Optimistic append
    setProjectsList([{ id: freshProj.id, title: freshProj.projectName, lastUpdated: new Date().toISOString(), createdAt: new Date().toISOString() }, ...projectsList]);
  };

  const deleteProject = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setConfirmDialog({
      message: "确定要删除此项目吗？",
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/projects/${id}`, { method: 'DELETE' });
          if (!res.ok) throw new Error('Delete failed');
          const newList = projectsList.filter(p => p.id !== id);
          setProjectsList(newList);
          if (projectId === id) {
            if (newList.length > 0) {
              loadProject(newList[0].id);
            } else {
              createNewProject();
            }
          }
        } catch(err) {
          console.error("Delete failed", err);
          alert("删除失败，请稍后重试");
        }
      }
    });
  };

  // Debounce Auto-Save
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!data || !projectId) return;
    
    if (originalDataRef.current === JSON.stringify(data)) {
      return;
    }
    
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    
    saveTimeoutRef.current = setTimeout(async () => {
      try {
        const payload = {
          id: data.id,
          title: data.projectName,
          themeId: data.themeId,
          activeLogo: data.activeLogo,
          savedLogos: data.savedLogos,
          slides: data.slides
        };
        await fetch('/api/projects', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        
        // Refresh project list to update lastUpdated timestamp
        const res = await fetch('/api/projects');
        const list = await res.json();
        setProjectsList(list);
      } catch(err) {
        console.error("Auto save failed", err);
      }
    }, 1000);
    
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [data]);

  // Iframe Message Listener
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'UPDATE_CONTENT' && event.data.html) {
        setData(prev => prev ? ({
          ...prev,
          slides: prev.slides.map(s => s.id === activeSlideId ? { ...s, code: event.data.html, isDefault: false } : s)
        }) : prev);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [activeSlideId]);

  const activeSlide = data?.slides.find(s => s.id === activeSlideId);

  // Handlers
  const addSlide = () => {
    if (!data) return;
    const newSlide: Slide = {
      id: uuidv4(),
      title: `幻灯片 ${data.slides.length + 1}`,
      code: getSlideTemplateContent(data.themeId || 'apple-light'),
      isDefault: true,
      templateType: 'content'
    };
    setData(prev => prev ? ({ ...prev, slides: [...prev.slides, newSlide] }) : prev);
    setActiveSlideId(newSlide.id);
  };

  const removeSlide = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!data) return;
    if (data.slides.length <= 1) return;
    setConfirmDialog({
      message: "确定要移除这页幻灯片吗？",
      onConfirm: () => {
        const newSlides = data.slides.filter(s => s.id !== id);
        setData(prev => prev ? ({ ...prev, slides: newSlides }) : prev);
        if (activeSlideId === id) {
          setActiveSlideId(newSlides[0].id);
        }
      }
    });
  };

  const duplicateSlide = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!data) return;
    const slideToCopy = data.slides.find(s => s.id === id);
    if (!slideToCopy) return;

    const newSlide: Slide = {
      ...slideToCopy,
      id: uuidv4(),
      title: `${slideToCopy.title} (副本)`
    };

    const index = data.slides.findIndex(s => s.id === id);
    const newSlides = [...data.slides];
    newSlides.splice(index + 1, 0, newSlide);

    setData(prev => prev ? ({ ...prev, slides: newSlides }) : prev);
    setActiveSlideId(newSlide.id);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const target = e.target as HTMLTextAreaElement;
      const start = target.selectionStart;
      const end = target.selectionEnd;
      const value = target.value;
      const newCode = value.substring(0, start) + '  ' + value.substring(end);
      updateSlideContent(newCode);
      
      // Preserve cursor position after render
      setTimeout(() => {
        target.selectionStart = target.selectionEnd = start + 2;
      }, 0);
    }
  };

  const updateSlideContent = (code: string) => {
    setData(prev => prev ? ({
      ...prev,
      slides: prev.slides.map(s => s.id === activeSlideId ? { ...s, code, isDefault: false } : s)
    }) : prev);
  };

  const updateSlideTitle = (id: string, title: string) => {
    setData(prev => prev ? ({
      ...prev,
      slides: prev.slides.map(s => s.id === id ? { ...s, title } : s)
    }) : prev);
  };

  const updateProjectName = (name: string) => {
    setData(prev => prev ? ({ ...prev, projectName: name }) : prev);
    setProjectsList(prev => prev.map(p => p.id === projectId ? { ...p, title: name } : p));
  };

  const updateTheme = (themeId: string) => {
    setData(prev => {
      if (!prev) return prev;
      const newSlides = prev.slides.map(s => {
        if (s.isDefault && s.templateType) {
          return {
            ...s,
            code: s.templateType === 'cover' ? getSlideTemplateCover(themeId) : getSlideTemplateContent(themeId)
          };
        }
        return s;
      });
      return { ...prev, themeId, slides: newSlides };
    });
  };

  const setSlides = (newSlides: Slide[]) => {
    setData(prev => prev ? ({ ...prev, slides: newSlides }) : prev);
  };

  const resetProject = () => {
    setConfirmDialog({
      message: "确定要清空当前项目并重新开始吗？此操作无法撤销。",
      onConfirm: () => {
        createNewProject();
      }
    });
  };

  const copyPrompt = () => {
    navigator.clipboard.writeText(activePromptText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadSkillFile = () => {
    const blob = new Blob([SKILL_FILE_CONTENT], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Zendeck_AI_Skill.md';
    a.click();
    URL.revokeObjectURL(url);
  };

  const importPresentation = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.html';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        const html = event.target?.result as string;
        try {
          const parser = new DOMParser();
          const doc = parser.parseFromString(html, 'text/html');
          
          // Verify it's our exported format
          const area = doc.getElementById('area');
          const layout = doc.getElementById('layout');
          const slidesElements = doc.querySelectorAll('.slide');
          
          if (!area || !layout) {
            alert('无效的文件格式：不支持的 HTML 文件，必须是本系统导出的文件。');
            return;
          }

          if (slidesElements.length === 0) {
            alert('无效的文件格式：没有找到任何幻灯片内容。');
            return;
          }

          const projectName = doc.title || '导入的演示文稿';
          
          const thumbTitleElements = doc.querySelectorAll('.thumb-title');
          
          const importedSlides: Slide[] = [];
          slidesElements.forEach((slideEl, index) => {
            const innerHTML = slideEl.innerHTML.trim();
            const extractedTitle = thumbTitleElements[index]?.textContent?.trim();
            const placeholderTitle = index === 0 ? '封面幻灯片' : `幻灯片 ${index + 1}`;
            
            importedSlides.push({
              id: uuidv4(),
              title: extractedTitle || placeholderTitle,
              code: innerHTML,
              isDefault: false
            });
          });

          // Optional: Extract activeLogo if it exists.
          const maybeLogo = area.querySelector('img');
          let activeLogo = undefined;
          if (maybeLogo && maybeLogo.style.position === 'absolute') {
            const url = maybeLogo.src;
            let position = 'top-right';
            const style = maybeLogo.getAttribute('style') || '';
            if (style.includes('bottom:24px') && style.includes('left:24px')) position = 'bottom-left';
            else if (style.includes('bottom:24px') && style.includes('right:24px')) position = 'bottom-right';
            else if (style.includes('top:24px') && style.includes('left:24px')) position = 'top-left';
            
            if (maybeLogo.parentElement === area) {
                activeLogo = {
                    url,
                    position
                };
            }
          }
          
          const parsedData = {
            id: uuidv4(),
            projectName,
            slides: importedSlides,
            themeId: THEMES[0].id,
            activeLogo: activeLogo as any
          };
          
          setData(parsedData);
          
          if (importedSlides.length > 0) {
            setActiveSlideId(importedSlides[0].id);
          }
          
          alert('导入成功！');

        } catch (error) {
          console.error(error);
          alert('解析 HTML 文件失败，请确保格式正确。');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  const exportPresentation = () => {
    if (!data) return;
    const slidesHtml = data.slides.map((s, index) => `
      <div class="slide ${index === 0 ? 'active' : ''}" id="slide-${index}">
        ${s.code}
      </div>
    `).join('');

    const template = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${data.projectName}</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
      tailwind.config = {
        theme: {
          extend: {
            animation: {
              'fade-in-up': 'fadeInUp 0.8s ease-out forwards',
              'fade-in': 'fadeIn 1s ease-out forwards',
            },
            keyframes: {
              fadeInUp: {
                '0%': { opacity: '0', transform: 'translateY(30px)' },
                '100%': { opacity: '1', transform: 'translateY(0)' },
              },
              fadeIn: {
                '0%': { opacity: '0' },
                '100%': { opacity: '1' },
              }
            }
          }
        }
      }
    </script>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        body { font-family: 'Inter', sans-serif; overflow: hidden; margin: 0; background: #0f1115; }
        .layout { display: flex; width: 100vw; height: 100vh; overflow: hidden; }
        .sidebar { width: 260px; background: #18181b; border-right: 1px solid #27272a; display: flex; flex-direction: column; z-index: 1000; flex-shrink: 0; }
        .sidebar-header { padding: 20px; font-size: 15px; font-weight: 600; border-bottom: 1px solid #27272a; color: #e4e4e7; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .sidebar-list { flex: 1; overflow-y: auto; padding: 12px; display: flex; flex-direction: column; gap: 6px; }
        .thumb-item { display: flex; align-items: center; gap: 12px; padding: 12px; border-radius: 8px; cursor: pointer; transition: all 0.2s; border: 1px solid transparent; }
        .thumb-item:hover { background: #27272a; }
        .thumb-item.active { background: rgba(59, 130, 246, 0.15); border-color: rgba(59, 130, 246, 0.4); }
        .thumb-num { font-size: 11px; font-weight: 700; color: #71717a; width: 20px; text-align: center; }
        .thumb-item.active .thumb-num { color: #60a5fa; }
        .thumb-title { font-size: 13px; color: #a1a1aa; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; flex: 1; }
        .thumb-item.active .thumb-title { color: #f4f4f5; font-weight: 500; }

        .player-container { flex: 1; position: relative; overflow: hidden; background: #0f1115; display: flex; align-items: center; justify-content: center; }
        
        .presentation-area {
            position: absolute;
            width: 1280px; 
            height: 720px;
            ${activeThemeConfig.cssVars}
            transform-origin: top left;
            overflow: hidden;
            box-shadow: 0 0 50px rgba(0,0,0,0.5);
        }

        .slide { 
            position: absolute; top: 0; left: 0; width: 100%; height: 100%; 
            opacity: 0; visibility: hidden; 
            transition: opacity 0.4s ease-in-out, transform 0.4s ease-in-out; 
            transform: translateX(40px);
            overflow-y: auto;
            overflow-x: hidden;
        }
        .slide.active { 
            opacity: 1; visibility: visible; 
            transform: translateX(0);
        }
        .slide.prev-out {
            transform: translateX(-40px);
        }
        
        /* GUI Controls */
        .progress {
            position: absolute; bottom: 0; left: 0; height: 3px; background: #3b82f6; 
            transition: width 0.3s ease; z-index: 1001;
        }
        .page-num { position: absolute; bottom: 20px; right: 24px; color: rgba(255,255,255,0.4); font-size: 14px; font-weight: 500; font-family: ui-monospace, monospace; z-index: 1000;}
        
        /* Fullscreen Button */
        .fullscreen-btn {
            position: absolute; top: 20px; right: 20px; z-index: 1000;
            background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.1);
            backdrop-filter: blur(4px); -webkit-backdrop-filter: blur(4px);
            border-radius: 8px; padding: 8px; cursor: pointer; color: #fff;
            opacity: 0; transition: all 0.3s;
            display: flex; align-items: center; justify-content: center;
        }
        .player-container:hover .fullscreen-btn { opacity: 0.3; }
        .fullscreen-btn:hover { opacity: 1 !important; transform: scale(1.05); background: rgba(255,255,255,0.2); }

        /* Skip Buttons */
        .skip-btn {
            position: absolute; bottom: 20px; z-index: 1002;
            background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1);
            backdrop-filter: blur(4px); -webkit-backdrop-filter: blur(4px);
            border-radius: 50%; width: 36px; height: 36px; cursor: pointer; color: rgba(255,255,255,0.4);
            opacity: 0.3; transition: all 0.3s;
            display: flex; align-items: center; justify-content: center;
        }
        .skip-btn:hover { opacity: 1; color: #fff; transform: scale(1.1); background: rgba(255,255,255,0.15); }
        .skip-btn.prev { left: 24px; }
        .skip-btn.next { right: 100px; } /* right next to page-num */
    </style>
</head>
<body>
    <div class="layout" id="layout">
        <div class="sidebar" id="sidebar">
            <div class="sidebar-header">${data.projectName}</div>
            <div class="sidebar-list" id="sidebar-list">
                ${data.slides.map((s, index) => `
                    <div class="thumb-item ${index === 0 ? 'active' : ''}" onclick="gotoSlide(${index})">
                        <div class="thumb-num">${(index + 1).toString().padStart(2, '0')}</div>
                        <div class="thumb-title">${s.title ? s.title.replace(/</g, '&lt;').replace(/>/g, '&gt;') : (index === 0 ? '封面幻灯片' : '幻灯片')}</div>
                    </div>
                `).join('')}
            </div>
        </div>
        <div class="player-container" id="player-container">
        <div class="presentation-area" id="area">
            ${data.activeLogo ? `<img src="${data.activeLogo.url}" style="${
                data.activeLogo.position === 'top-left' ? 'position:absolute; top:24px; left:24px;' :
                data.activeLogo.position === 'top-right' ? 'position:absolute; top:24px; right:24px;' :
                data.activeLogo.position === 'bottom-left' ? 'position:absolute; bottom:24px; left:24px;' :
                'position:absolute; bottom:24px; right:24px;'
            } height:64px; max-width:200px; object-fit:contain; z-index:50;" />` : ''}
            ${slidesHtml}
        </div>
        
        <!-- Skip Buttons -->
        <button class="skip-btn prev" onmousedown="forcePrev(event)" title="直接上一页（跳过动画）">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
        </button>
        <button class="skip-btn next" onmousedown="forceNext(event)" title="直接下一页（跳过动画）">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
        </button>
        
        <!-- Fullscreen Toggle -->
        <button id="fs-btn" class="fullscreen-btn" onclick="toggleFullScreen()" title="全屏查看 (支持 ESC 退出)">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/></svg>
        </button>

        <div class="progress" id="progress"></div>
        <div class="page-num" id="page-num">1 / ${data.slides.length}</div>
    </div>
</div>

    <script>
        (function() {
            let currentSlide = 0;
            const slides = document.querySelectorAll('.slide');
            const thumbs = document.querySelectorAll('.thumb-item');
            const progressBar = document.getElementById('progress');
            const pageNum = document.getElementById('page-num');
            const area = document.getElementById('area');
            const container = document.getElementById('player-container');

            function resizeLayout() {
                const cw = container.clientWidth;
                const ch = container.clientHeight;
                const scale = Math.min(cw / 1280, ch / 720);
                area.style.transform = 'scale(' + scale + ')';
                area.style.left = ((cw - 1280 * scale) / 2) + 'px';
                area.style.top = ((ch - 720 * scale) / 2) + 'px';
            }
            window.addEventListener('resize', resizeLayout);
            setTimeout(resizeLayout, 0);

            function toggleFullScreen() {
                if (!document.fullscreenElement) {
                    container.requestFullscreen().catch(err => {
                        console.log("全屏请求失败: " + err.message);
                    });
                } else {
                    if (document.exitFullscreen) {
                        document.exitFullscreen();
                    }
                }
            }
            
            document.addEventListener('fullscreenchange', () => {
                setTimeout(resizeLayout, 100);
            });

            function update() {
                slides.forEach((s, i) => {
                    const wasActive = s.classList.contains('active');
                    if (i === currentSlide) {
                        s.className = 'slide active';
                        if (!wasActive) s.dispatchEvent(new CustomEvent('slideenter', { bubbles: true }));
                    } else if (i < currentSlide) {
                        s.className = 'slide prev-out';
                        if (wasActive) s.dispatchEvent(new CustomEvent('slideleave', { bubbles: true }));
                    } else {
                        s.className = 'slide';
                        if (wasActive) s.dispatchEvent(new CustomEvent('slideleave', { bubbles: true }));
                    }
                });
                
                thumbs.forEach((t, i) => {
                    if (i === currentSlide) {
                        t.classList.add('active');
                        t.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                    } else {
                        t.classList.remove('active');
                    }
                });

                document.dispatchEvent(new CustomEvent('slidechange', { detail: { currentSlide } }));
                
                progressBar.style.width = ((currentSlide + 1) / slides.length * 100) + '%';
                pageNum.innerText = (currentSlide + 1) + ' / ' + slides.length;
            }

            function nextSlide() {
                if (currentSlide < slides.length - 1) {
                    currentSlide++;
                    update();
                }
            }

            function prevSlide() {
                if (currentSlide > 0) {
                    currentSlide--;
                    update();
                }
            }
            
            function forceNext(e) {
                e.stopPropagation();
                if (currentSlide < slides.length - 1) {
                    currentSlide++;
                    update();
                }
            }

            function forcePrev(e) {
                e.stopPropagation();
                if (currentSlide > 0) {
                    currentSlide--;
                    update();
                }
            }

            function gotoSlide(index) {
                if (index >= 0 && index < slides.length) {
                    currentSlide = index;
                    update();
                }
            }

            // Global click event delegation for turning pages inside container
            container.addEventListener('click', (e) => {
                // Respect e.stopPropagation() from inner components
                if (e.defaultPrevented) return;
                
                const isInteractive = e.target.closest('button, a, input, select, textarea, [role="button"], [contenteditable="true"], .interactive-component, [data-interactive]');
                if (isInteractive) return;
                
                const rect = container.getBoundingClientRect();
                const x = e.clientX - rect.left;
                if (x > rect.width * 0.3) {
                    nextSlide();
                } else {
                    prevSlide();
                }
            }, false);

            document.addEventListener('keydown', (e) => {
                if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'Enter') nextSlide();
                if (e.key === 'ArrowLeft') prevSlide();
            });
            
            update(); // Force initial state

            // Expose globally for inline event handlers
            window.toggleFullScreen = toggleFullScreen;
            window.forceNext = forceNext;
            window.forcePrev = forcePrev;
            window.nextSlide = nextSlide;
            window.prevSlide = prevSlide;
            window.gotoSlide = gotoSlide;
        })();
    </script>
</body>
</html>`;

    const blob = new Blob([template], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${data.projectName.replace(/\s+/g, '_')}_Presentation.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="flex h-screen bg-[#FDFDFD] overflow-hidden text-[#1d1d1f]">
      {/* Projects Sidebar */}
      <motion.aside 
        initial={false}
        animate={{ width: showProjectsSidebar ? 256 : 72 }}
        className="flex-shrink-0 flex flex-col border-r border-[#ececeb] bg-[#fbfbfb] z-20 select-none overflow-hidden"
      >
        <div className="w-[256px] h-full flex flex-col">
          <div className="px-5 border-b border-[#ececeb] flex items-center h-[73px] flex-shrink-0">
            <div className="flex items-center gap-3 flex-1">
              <button 
                onClick={() => setShowProjectsSidebar(!showProjectsSidebar)}
                className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shadow-sm hover:bg-blue-700 transition-colors flex-shrink-0"
                title="切换项目列表"
              >
                <ShieldCheck className="text-white w-5 h-5 flex-shrink-0" />
              </button>
              <h1 className={`font-semibold text-lg tracking-tight whitespace-nowrap transition-opacity duration-200 ${showProjectsSidebar ? 'opacity-100' : 'opacity-0'}`}>Zendeck</h1>
            </div>
            {showProjectsSidebar && (
              <button 
                onClick={createNewProject}
                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors flex-shrink-0"
                title="新建项目"
              >
                <Plus size={18} />
              </button>
            )}
          </div>
          <div className="flex-1 flex flex-col overflow-hidden">
            
            {/* Projects Section */}
            <div className={`flex flex-col border-b border-[#ececeb] transition-all duration-300 ${expandedSection === 'projects' && showProjectsSidebar ? 'flex-[1.5]' : 'flex-none'}`}>
              <button 
                onClick={() => {
                  if (!showProjectsSidebar) {
                    setShowProjectsSidebar(true);
                    setExpandedSection('projects');
                  } else if (expandedSection === 'projects') {
                    setExpandedSection('none');
                  } else {
                    setExpandedSection('projects');
                  }
                }}
                className={`flex items-center px-5 py-4 transition-all w-[256px] text-left outline-none ${expandedSection === 'projects' && showProjectsSidebar ? 'bg-gradient-to-r from-blue-100/60 via-blue-50/30 to-transparent border-l-[4px] border-blue-600' : 'hover:bg-gradient-to-r hover:from-gray-50/80 hover:to-transparent border-l-[4px] border-transparent'}`}
              >
                <Folder className={`mr-4 flex-shrink-0 transition-colors ${expandedSection === 'projects' && showProjectsSidebar ? 'text-blue-600' : 'text-[#86868b]'}`} size={22} />
                <span className={`font-medium tracking-wide whitespace-nowrap transition-all duration-200 ${showProjectsSidebar ? 'opacity-100' : 'opacity-0'} ${expandedSection === 'projects' && showProjectsSidebar ? 'text-blue-800' : 'text-[#1d1d1f]'}`}>我的项目</span>
              </button>
              
              <div className={`overflow-hidden transition-all duration-300 flex flex-col ${expandedSection === 'projects' && showProjectsSidebar ? 'h-full opacity-100' : 'h-0 opacity-0'}`}>
                <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2">
                  {projectsList.map(proj => (
                    <div 
                      key={proj.id} 
                      onClick={() => loadProject(proj.id)} 
                      className={`group relative flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all border ${
                        projectId === proj.id 
                          ? 'bg-white border-[#e5e5e7] shadow-sm' 
                          : 'bg-transparent border-transparent hover:bg-white/50'
                      }`}
                    >
                      <FileText size={18} className={projectId === proj.id ? "text-blue-500 flex-shrink-0" : "text-gray-400 flex-shrink-0"} />
                      <div className="flex-1 flex flex-col min-w-0">
                        <span className={`text-sm font-medium truncate ${projectId === proj.id ? 'text-gray-900' : 'text-gray-700'}`}>
                          {proj.title}
                        </span>
                        <span className="text-[10px] text-gray-500">
                          {new Date(proj.lastUpdated).toLocaleDateString()} {new Date(proj.lastUpdated).toLocaleTimeString().slice(0,5)}
                        </span>
                      </div>
                      <button 
                        onClick={(e) => deleteProject(proj.id, e)} 
                        className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 transition-opacity flex-shrink-0 absolute right-2"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Assets Section */}
            <div className={`flex flex-col border-b border-[#ececeb] transition-all duration-300 ${expandedSection === 'assets' && showProjectsSidebar ? 'flex-[2]' : 'flex-none'}`}>
              <button 
                onClick={() => {
                  if (!showProjectsSidebar) {
                    setShowProjectsSidebar(true);
                    setExpandedSection('assets');
                  } else if (expandedSection === 'assets') {
                    setExpandedSection('none');
                  } else {
                    setExpandedSection('assets');
                  }
                }}
                className={`flex items-center px-5 py-4 transition-all w-[256px] text-left outline-none ${expandedSection === 'assets' && showProjectsSidebar ? 'bg-gradient-to-r from-blue-100/60 via-blue-50/30 to-transparent border-l-[4px] border-blue-600' : 'hover:bg-gradient-to-r hover:from-gray-50/80 hover:to-transparent border-l-[4px] border-transparent'}`}
              >
                <ImageIcon className={`mr-4 flex-shrink-0 transition-colors ${expandedSection === 'assets' && showProjectsSidebar ? 'text-blue-600' : 'text-[#86868b]'}`} size={22} />
                <span className={`font-medium tracking-wide whitespace-nowrap transition-all duration-200 ${showProjectsSidebar ? 'opacity-100' : 'opacity-0'} ${expandedSection === 'assets' && showProjectsSidebar ? 'text-blue-800' : 'text-[#1d1d1f]'}`}>素材库</span>
              </button>
              
              <div className={`overflow-hidden transition-all duration-300 flex flex-col ${expandedSection === 'assets' && showProjectsSidebar ? 'h-full opacity-100' : 'h-0 opacity-0'}`}>
                <AssetLibraryModal isOpen={true} onClose={() => setShowProjectsSidebar(false)} />
              </div>
            </div>

          </div>
        </div>
      </motion.aside>
      
      {/* Slide Outline Sidebar */}
      <aside className="w-72 flex flex-col border-r border-[#ececeb] bg-white z-10 select-none">
        <div className="px-5 border-b border-[#ececeb] bg-white flex items-center justify-between h-[73px] flex-shrink-0">
          <span className="text-xs font-semibold text-[#86868b] uppercase tracking-wider">幻灯片大纲</span>
          <button 
            onClick={addSlide}
            className="p-1.5 hover:bg-[#f5f5f7] rounded-md transition-colors text-blue-600"
            title="添加幻灯片"
          >
            <Plus size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-1">
          {data && (
            <ReactSortable 
              list={data.slides} 
              setList={setSlides} 
              handle=".drag-handle"
              animation={200}
              className="space-y-1"
            >
              {data.slides.map((slide, index) => (
                <motion.div
                  layoutId={slide.id}
                  key={slide.id}
                  onClick={() => setActiveSlideId(slide.id)}
                  className={`group relative flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all duration-200 border ${
                    activeSlideId === slide.id 
                      ? 'bg-[#f5f5f7] border-[#e5e5e7] shadow-sm' 
                      : 'bg-transparent border-transparent hover:bg-[#fbfbfb]'
                  }`}
                >
                  <div className="drag-handle opacity-0 group-hover:opacity-40 hover:opacity-100 transition-opacity p-0.5 cursor-grab active:cursor-grabbing">
                    <GripVertical size={16} />
                  </div>
                  <div className="flex-1 flex flex-col min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold tabular-nums ${activeSlideId === slide.id ? 'text-blue-500' : 'text-[#86868b]'}`}>{(index + 1).toString().padStart(2, '0')}</span>
                      <div className="flex-1">
                        <input
                          value={slide.title}
                          onChange={(e) => updateSlideTitle(slide.id, e.target.value)}
                          className={`bg-transparent border-none focus:ring-0 p-0 text-sm font-medium truncate w-full outline-none ${activeSlideId === slide.id ? 'text-[#1d1d1f]' : 'text-[#86868b]'}`}
                          onClick={(e) => e.stopPropagation()}
                          placeholder="滑块标题..."
                        />
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={(e) => duplicateSlide(slide.id, e)}
                      className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-black/5 rounded-md transition-all"
                      title="克隆幻灯片"
                    >
                      <Copy size={13} />
                    </button>
                    {data.slides.length > 1 && (
                      <button 
                        onClick={(e) => removeSlide(slide.id, e)}
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-black/5 rounded-md transition-all"
                        title="删除幻灯片"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                </motion.div>
              ))}
            </ReactSortable>
          )}
        </div>

        <div className="p-4 border-t border-[#ececeb] bg-[#fbfbfb] flex flex-col gap-2">
          <button 
            onClick={exportPresentation}
            className="w-full h-11 bg-[#1d1d1f] hover:bg-black text-white rounded-xl font-medium flex items-center justify-center gap-2 transition-all shadow-md active:scale-[0.98]"
          >
            <Download size={18} />
            <span>导出演示文稿</span>
          </button>

          <button 
            onClick={importPresentation}
            className="w-full h-11 bg-white hover:bg-gray-50 text-gray-800 border border-[#e5e5e7] rounded-xl font-medium flex items-center justify-center gap-2 transition-all shadow-sm active:scale-[0.98]"
          >
            <Upload size={18} />
            <span>导入并继续编辑</span>
          </button>
        </div>
      </aside>

      {/* Main Area */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        {/* Header */}
        <header className="h-auto lg:h-[73px] py-3 lg:py-0 flex flex-col lg:flex-row lg:items-center justify-between px-4 lg:px-6 border-b border-[#ececeb] bg-white/80 backdrop-blur-md sticky top-0 z-10 transition-all gap-3 lg:gap-0 flex-shrink-0">
          <div className="flex items-center gap-3 w-full lg:w-auto flex-shrink-0">
            <Settings className="text-[#86868b]" size={18} />
            <input 
              value={data?.projectName || ""}
              onChange={(e) => updateProjectName(e.target.value)}
              className="text-base lg:text-lg font-semibold bg-transparent border-none focus:ring-0 p-0 w-full"
              placeholder="命名您的培训项目..."
            />
          </div>
          
          <div className="flex flex-wrap items-center gap-2 lg:gap-4 pb-1 lg:pb-0 w-full lg:w-auto">
             <div className="flex items-center gap-2 flex-shrink-0 relative">
               <button 
                 onClick={() => setShowLogoManager(true)}
                 className="flex items-center gap-2 bg-transparent border-none text-sm font-medium focus:ring-0 text-[#1d1d1f] hover:bg-[#f5f5f7] rounded-md px-2 py-1 cursor-pointer transition-colors outline-none h-8"
                 title={data?.activeLogo ? "更换 Logo" : "添加/管理 Logo"}
               >
                 {data?.activeLogo ? (
                   <div className="relative group flex items-center justify-center">
                     <img src={data.activeLogo.url} alt="Logo" className="h-[20px] w-auto max-w-[60px] object-contain rounded border border-gray-200" />
                     <div 
                       className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer z-10"
                       onClick={(e) => {
                         e.stopPropagation();
                         setData(prev => prev ? {...prev, activeLogo: undefined} : null);
                       }}
                     >
                       <X size={10} />
                     </div>
                   </div>
                 ) : (
                   <>
                     <Image size={16} className="text-[#86868b]" />
                     <span className="hidden sm:inline">Logo</span>
                   </>
                 )}
               </button>
             </div>
             
             <div className="w-[1px] h-4 bg-gray-200 flex-shrink-0"></div>

             <div className="flex items-center gap-2 relative flex-shrink-0">
               <Palette size={16} className="text-[#86868b]" />
               <button 
                 onClick={() => setShowThemeMenu(!showThemeMenu)}
                 className="flex items-center gap-2 bg-transparent border-none text-sm font-medium focus:ring-0 text-[#1d1d1f] hover:bg-[#f5f5f7] rounded-md px-2 py-1 cursor-pointer transition-colors outline-none flex-shrink-0"
               >
                 <span className="w-3 h-3 rounded-full border border-gray-200 flex-shrink-0" style={{ background: activeThemeConfig.previewColor }}></span>
                 <span className="whitespace-nowrap">{activeThemeConfig.name}</span>
                 <ChevronDown size={14} className="text-gray-400 flex-shrink-0" />
               </button>
               
               <AnimatePresence>
                 {showThemeMenu && (
                   <>
                     <div className="fixed inset-0 z-40" onClick={() => setShowThemeMenu(false)}></div>
                     <motion.div 
                       initial={{ opacity: 0, y: -10 }}
                       animate={{ opacity: 1, y: 0 }}
                       exit={{ opacity: 0, y: -10 }}
                       className="absolute top-10 left-0 z-50 w-64 max-h-96 overflow-y-auto bg-white rounded-xl shadow-2xl border border-gray-100 p-2"
                     >
                       <div className="text-xs font-semibold text-gray-400 px-3 py-2 uppercase tracking-wider">选择主题色</div>
                       <div className="grid grid-cols-1 gap-1">
                         {THEMES.map(theme => (
                           <button
                             key={theme.id}
                             onClick={() => { updateTheme(theme.id); setShowThemeMenu(false); }}
                             className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-left transition-colors ${theme.id === activeThemeConfig.id ? 'bg-blue-50 text-blue-700 font-medium' : 'hover:bg-gray-50 text-gray-700'}`}
                           >
                             <div className="w-5 h-5 rounded-full border border-gray-200 shadow-sm flex-shrink-0" style={{ background: theme.previewColor }}></div>
                             <span className="truncate">{theme.name}</span>
                             {theme.id === activeThemeConfig.id && <Check size={14} className="ml-auto text-blue-600 flex-shrink-0" />}
                           </button>
                         ))}
                       </div>
                     </motion.div>
                   </>
                 )}
               </AnimatePresence>
             </div>

             <button
              onClick={() => setShowAgentModal(true)}
              className="flex items-center gap-2 px-4 py-1.5 rounded-xl text-sm font-medium bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20 hover:shadow-lg hover:shadow-blue-500/30 transition-all flex-shrink-0 whitespace-nowrap"
            >
              <Sparkles size={16} className="flex-shrink-0" />
              一键生成
            </button>

            <button
              onClick={() => setShowAssistant(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-medium bg-blue-50 text-blue-600 border border-blue-100 hover:bg-blue-100 transition-all flex-shrink-0 whitespace-nowrap"
            >
              手工提示词
            </button>

            <button
              onClick={() => setShowSettingsModal(true)}
              className="p-2 text-gray-400 hover:text-gray-900 transition-colors flex-shrink-0"
            >
              <Settings2 size={18} />
            </button>

            <div className="p-1 bg-[#f5f5f7] rounded-xl flex items-center border border-[#e5e5e7] flex-shrink-0 whitespace-nowrap">
              <button
                onClick={() => setViewMode('preview')}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  viewMode === 'preview' ? 'bg-white shadow-sm text-[#1d1d1f]' : 'text-[#86868b] hover:text-[#1d1d1f]'
                }`}
              >
                <Eye size={16} className="flex-shrink-0" />
                预览
              </button>
              <button
                onClick={() => setViewMode('code')}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  viewMode === 'code' ? 'bg-white shadow-sm text-[#1d1d1f]' : 'text-[#86868b] hover:text-[#1d1d1f]'
                }`}
              >
                <Code size={16} className="flex-shrink-0" />
                编辑
              </button>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <div className="flex-1 flex overflow-hidden">
          {/* Editor/Preview Content */}
          <div className={`flex-1 bg-[#F9F9FB] p-8 flex flex-col items-center min-w-0 ${viewMode === 'code' ? 'overflow-hidden' : 'overflow-y-auto'}`}>
            <div className="w-full max-w-5xl flex flex-col h-full gap-6">
              <AnimatePresence mode="wait">
                {viewMode === 'preview' ? (
                <motion.div 
                  key="preview"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="w-full flex-col flex items-center relative group"
                >
                  <div className="absolute -top-10 right-0 text-xs text-gray-500 bg-gray-100 px-3 py-1.5 rounded-full z-10 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                    <span>💡 双击幻灯片中的文本可直接编辑，编辑完点击空白处即可保存</span>
                  </div>
                  <div className="aspect-video w-full rounded-2xl shadow-2xl overflow-hidden border border-[#e5e5e7] relative">
                    <SlidePreview code={activeSlide?.code || ""} themeCss={activeThemeConfig.cssVars} activeLogo={data?.activeLogo} />
                  </div>
                </motion.div>
              ) : (
                <motion.div 
                  key="code"
                  initial={{ opacity: 0, scale: 0.99 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.99 }}
                  className="w-full flex-1 flex flex-col min-h-0 h-full gap-4"
                >
                  <div className="bg-[#1e1e1e] rounded-2xl shadow-xl flex flex-col overflow-hidden min-h-0 h-full border border-black/10">
                    <div className="flex items-center gap-2 px-6 py-4 bg-[#252526] border-b border-[#333]">
                      <div className="w-3 h-3 rounded-full bg-rose-500/80"></div>
                      <div className="w-3 h-3 rounded-full bg-amber-500/80"></div>
                      <div className="w-3 h-3 rounded-full bg-emerald-500/80"></div>
                      <span className="ml-2 text-xs font-mono text-zinc-400 font-medium tracking-wider">SlideEditor.html</span>
                    </div>
                    <textarea 
                      value={activeSlide?.code || ""}
                      onChange={(e) => updateSlideContent(e.target.value)}
                      onKeyDown={handleKeyDown}
                      spellCheck={false}
                      className="w-full flex-1 bg-transparent text-zinc-300 font-mono text-sm border-none focus:ring-0 leading-relaxed resize-none p-6 outline-none"
                      placeholder="在此处粘贴 AI 生成的纯 HTML 代码块 (使用 Tailwind 样式)..."
                    />
                  </div>
                </motion.div>
              )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </main>

      {/* AI Assistant Modal */}
      <AnimatePresence>
        {showAssistant && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                    <Sparkles size={24} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold tracking-tight">AI 协作助手</h2>
                    <p className="text-sm text-slate-500">获取设计规范及开发者能力文件</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowAssistant(false)}
                  className="p-2 hover:bg-slate-50 rounded-xl transition-colors"
                >
                  <X size={20} className="text-slate-400" />
                </button>
              </div>

              <div className="p-8 space-y-8 overflow-y-auto max-h-[70vh]">
                {/* Prompt Section */}
                <section className="space-y-4">
                  <div className="flex items-center gap-2 text-slate-900 border-l-4 border-blue-600 pl-4">
                    <BookOpen size={20} />
                    <h3 className="font-bold">推荐的 Design Spec Prompt</h3>
                  </div>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    复制下方的 Prompt 并填入您的需求。将其发送给 AI（如 ChatGPT 或 Claude），它将为您生成符合本系统规范的课件代码。
                  </p>
                  <div className="relative group">
                    <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={copyPrompt}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-white shadow-xl border border-slate-100 rounded-xl text-xs font-bold hover:bg-slate-50 transition-all active:scale-95"
                      >
                        {copied ? <Check size={14} className="text-green-600" /> : <Copy size={14} />}
                        {copied ? '已复制' : '复制模版'}
                      </button>
                    </div>
                    <pre className="p-4 bg-slate-50 rounded-2xl text-[11px] text-slate-700 border border-slate-100 font-mono whitespace-pre-wrap leading-relaxed shadow-inner">
                      {activePromptText}
                    </pre>
                  </div>
                  <div className="flex items-start gap-2 p-3 bg-amber-50 text-amber-800 rounded-xl border border-amber-100 text-xs">
                    <span className="font-bold">提示：</span> 
                    <span>当您切换了顶部的主题色后，这里的 Prompt 也会自动更新。请将新的 Prompt 重新发给 AI 以生成最佳排版代码。</span>
                  </div>
                </section>

                {/* Skill File Section */}
                <section className="space-y-4 p-6 bg-blue-50/50 rounded-2xl border border-blue-100">
                  <div className="flex items-center gap-2 text-blue-900">
                    <Terminal size={20} />
                    <h3 className="font-bold">标准化开发者文件 (Skill File)</h3>
                  </div>
                  <p className="text-sm text-blue-700/80 leading-relaxed">
                    下载 Skill 文件并将其作为背景知识库上传到您的 AI Agent（如 Claude Projects 或 GPTs）。
                    这能让 AI 始终输出符合 Zendeck 极致简约美学的 HTML 代码。
                  </p>
                  <button 
                    onClick={downloadSkillFile}
                    className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-2xl font-bold text-sm shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all active:scale-95"
                  >
                    <Download size={18} />
                    下载 Zendeck_AI_Skill.md
                  </button>
                </section>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <SettingsModal 
        isOpen={showSettingsModal} 
        onClose={() => setShowSettingsModal(false)} 
      />

      <LogoManagerModal 
        isOpen={showLogoManager}
        onClose={() => setShowLogoManager(false)}
        savedLogos={data?.savedLogos || []}
        activeLogo={data?.activeLogo}
        onLogosChange={(newLogos) => setData(prev => prev ? { ...prev, savedLogos: newLogos } : null)}
        onActiveLogoChange={(newLogo) => setData(prev => prev ? { ...prev, activeLogo: newLogo } : null)}
      />

      <AgentModal 
        isOpen={showAgentModal} 
        onClose={() => setShowAgentModal(false)}
        onOpenSettings={() => {
          setShowAgentModal(false);
          setShowSettingsModal(true);
        }}
        themeId={activeThemeConfig.id}
        themePromptRule={activeThemeConfig.promptRule}
        activeLogo={data?.activeLogo}
        onGenerateComplete={(newProjectName, newSlides) => {
          setData(prev => ({
            ...(prev || { id: uuidv4() }),
            projectName: newProjectName,
            themeId: activeThemeConfig.id,
            slides: newSlides
          }));
          if (newSlides.length > 0) {
            setActiveSlideId(newSlides[0].id);
          }
          setViewMode('preview');
        }}
      />

      {confirmDialog && (
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm flex flex-col gap-4 text-center"
          >
            <h3 className="text-lg font-medium text-gray-900">{confirmDialog.message}</h3>
            <div className="flex items-center gap-3 w-full mt-2">
              <button 
                onClick={() => setConfirmDialog(null)}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-[#1d1d1f] py-2 rounded-lg font-medium transition-colors"
              >
                取消
              </button>
              <button 
                onClick={() => {
                  confirmDialog.onConfirm();
                  setConfirmDialog(null);
                }}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 rounded-lg font-medium transition-colors"
              >
                确定
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

// --- Preview Component using iframe ---

const getLogoStyle = (pos: string) => {
  const base = "position:absolute; height:64px; max-width:200px; object-fit:contain; z-index:50;";
  if (pos === 'top-left') return `${base} top:24px; left:24px;`;
  if (pos === 'top-right') return `${base} top:24px; right:24px;`;
  if (pos === 'bottom-left') return `${base} bottom:24px; left:24px;`;
  if (pos === 'bottom-right') return `${base} bottom:24px; right:24px;`;
  return `${base} top:24px; left:24px;`;
};

function SlidePreview({ code, themeCss, activeLogo }: { code: string, themeCss: string, activeLogo?: LogoConfig }) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (!iframeRef.current) return;
    const iframe = iframeRef.current;
    
    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!doc) return;

    const fullHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <script src="https://cdn.tailwindcss.com"></script>
          <script>
            tailwind.config = {
              theme: {
                extend: {
                  animation: {
                    'fade-in-up': 'fadeInUp 0.8s ease-out forwards',
                    'fade-in': 'fadeIn 1s ease-out forwards',
                  },
                  keyframes: {
                    fadeInUp: {
                      '0%': { opacity: '0', transform: 'translateY(30px)' },
                      '100%': { opacity: '1', transform: 'translateY(0)' },
                    },
                    fadeIn: {
                      '0%': { opacity: '0' },
                      '100%': { opacity: '1' },
                    }
                  }
                }
              }
            }
          </script>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
            body { font-family: 'Inter', sans-serif; margin: 0; overflow: hidden; background: transparent; width: 100vw; height: 100vh; }
            .presentation-area { 
              width: 1280px; 
              height: 720px; 
              ${themeCss}
              position: absolute;
              transform-origin: top left;
              overflow-y: auto;
              overflow-x: hidden;
            }
          </style>
        </head>
        <body>
          <div class="presentation-area" id="area">
            ${activeLogo ? `<img id="preview-logo" src="${activeLogo.url}" style="${getLogoStyle(activeLogo.position)}" />` : ''}
            ${code}
          </div>
          <script>
            function resize() {
              const scale = Math.min(window.innerWidth / 1280, window.innerHeight / 720);
              const area = document.getElementById('area');
              area.style.transform = 'scale(' + scale + ')';
              area.style.left = ((window.innerWidth - 1280 * scale) / 2) + 'px';
              area.style.top = ((window.innerHeight - 720 * scale) / 2) + 'px';
            }
            window.addEventListener('resize', resize);
            resize(); // Initial scale
            
            document.addEventListener('dblclick', function(e) {
              let target = e.target;
              while (target && target.id !== 'area' && target !== document.body) {
                if (['H1', 'H2', 'H3', 'P', 'SPAN', 'DIV', 'LI'].includes(target.tagName)) {
                  target.setAttribute('contenteditable', 'true');
                  target.style.outline = '2px dashed rgba(59, 130, 246, 0.5)';
                  target.focus();
                  break;
                }
                target = target.parentElement;
              }
            });

            document.addEventListener('blur', function(e) {
              let target = e.target;
              if (target.getAttribute && target.getAttribute('contenteditable') === 'true') {
                target.removeAttribute('contenteditable');
                target.style.outline = '';
                
                // Clone the area to strip the logo before saving
                const areaClone = document.getElementById('area').cloneNode(true);
                const logo = areaClone.querySelector('#preview-logo');
                if (logo) {
                    logo.remove();
                }
                
                // Send the updated HTML
                window.parent.postMessage({
                   type: 'UPDATE_CONTENT', 
                   html: areaClone.innerHTML.trim()
                }, '*');
              }
            }, true);
            
            // Allow clicking on editable elements without bubbling to somewhere else and prevent default if needed
            document.addEventListener('keydown', function(e) {
               if (e.key === 'Enter' && e.target.getAttribute('contenteditable') === 'true') {
                   // allow newlines if Shift is held, otherwise we can let it just be.
                   // actually let's just let contenteditable behave normally.
               }
            });
          </script>
        </body>
      </html>
    `;

    doc.open();
    doc.write(fullHtml);
    doc.close();
  }, [code, themeCss]);

  return (
    <iframe 
      ref={iframeRef}
      className="w-full h-full border-none bg-transparent"
      title="Slide Preview"
    />
  );
}
