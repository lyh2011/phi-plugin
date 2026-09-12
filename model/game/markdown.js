import { Config, logger, segment } from '../../components/index.js'
import send from '../render/send.js'
import platform from '../../components/platform/index.js'


/** @import {botEvent} from '../../components/baseClass.js' */

/** @param {unknown} value */
export function escapeMarkdownText(value) {
    return String(value ?? '')
        .replace(/[\u0000-\u001f\u007f]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .replace(/\\/g, '\\\\')
        .replace(/([|*_`~])/g, '\\$1')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
}

/** @param {unknown} value */
export function escapeCommandAttribute(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
}

/** @param {string} text @param {string} show */
export function commandInput(text, show) {
    return `<qqbot-cmd-input text="${escapeCommandAttribute(text)}" show="${escapeCommandAttribute(show)}" reference="false" />`
}

/**
 * 判断当前事件是否来自 QQ 官方机器人。
 * QQ 官方机器人使用 QQBot 适配器，只有它支持 qqbot-cmd-input 快捷输入标签。
 * @param {botEvent} e
 */
export function isOfficialBot(e) {
    const adapter = platform.getAdapterName(e)
    return typeof adapter === 'string' && /^(qqbot|qq[-_ ]?official[-_ ]?bot)$/i.test(adapter.trim())
}

/**
 * 构建通用的快捷操作菜单。
 * @param {{command:string,label:string}[]} commands
 * @param {string} [title]
 */
export function buildQuickCommandMarkdown(commands, title = '快捷操作') {
    const unique = []
    const seen = new Set()
    for (const item of commands || []) {
        if (!item?.command || !item?.label) continue
        const command = String(item.command).trim()
        const label = String(item.label).trim()
        if (!command || !label || seen.has(command)) continue
        seen.add(command)
        unique.push({ command, label })
    }
    if (!unique.length) return ''
    const rows = []
    for (let index = 0; index < unique.length; index += 3) {
        const row = unique.slice(index, index + 3)
        while (row.length < 3) row.push({ command: '', label: '' })
        rows.push(`| ${row.map(item => item.command ? commandInput(item.command, item.label) : '').join(' | ')} |`)
    }
    return ['***', `${escapeMarkdownText(title)}：`, '', '| 操作 | 操作 | 操作 |', '| :---: | :---: | :---: |', ...rows].join('\n')
}

/**
 * 向 QQ 官方机器人发送快捷操作菜单。
 * @param {botEvent} e
 * @param {{command:string,label:string}[]} commands
 * @param {string} [title]
 */
export async function sendQuickCommands(e, commands, title = '快捷操作') {
    if (!isOfficialBot(e) || !Config.getUserCfg('config', 'LetterMarkdown')) return
    const markdown = buildQuickCommandMarkdown(commands, title)
    if (!markdown) return
    try {
        const sent = /** @type {{error?: unknown[]}|undefined} */ (await send.reply(e, segment.markdown(markdown)))
        if (sent?.error?.length) logger.warn('[phi-plugin] 快捷操作 Markdown 发送失败')
    } catch (error) {
        logger.warn('[phi-plugin] 快捷操作 Markdown 发送失败', error)
    }
}

/** 常用的插件入口，供各结果页复用。 */
export const commonQuickCommands = commandHead => {
    const head = String(commandHead ?? '').replace(/^[/#]+/, '')
    if (!head) return []
    return [
        { command: `/${head} help`, label: '帮助' },
        { command: `/${head} update`, label: '更新存档' },
        { command: `/${head} b19`, label: 'B19' },
        { command: `/${head} myset`, label: '用户设置' },
        { command: `/${head} market`, label: '主题市场' },
    ]
}

/**
 * @param {{slug:string,name:string,botDownloadAllowed:boolean|null}[]} themes
 * @param {{page?:number,pageCount?:number}} [pagination]
 */
export function buildMarketQuickMarkdown(themes, pagination = {}) {
    if (!themes.length) return ''
    const commandHead = `${Config.getUserCfg('config', 'cmdhead')}`
    const rows = themes.map(theme => [
        escapeMarkdownText(theme.name),
        commandInput(`/${commandHead} market detail ${theme.slug}`, '查看详情'),
        commandInput(`/${commandHead} market ${theme.slug}`, '使用主题'),
    ])
    const table = [
        `| 名称 | 查看详情 | 使用主题 |`,
        '| :---: | :---: | :---: |',
        ...rows.map(row => `| ${row.join(' | ')} |`),
    ]
    const page = pagination.page || 1
    const pageCount = pagination.pageCount || 1
    const navigation = pageCount > 1 ? [
        '',
        '***',
        `| ${page > 1 ? commandInput(`/${commandHead}pr`, '上一页') : '已是首页'} | ${page} / ${pageCount} 页 | ${page < pageCount ? commandInput(`/${commandHead}nx`, '下一页') : '已是末页'} |`,
        '| :---: | :---: | :---: |',
    ] : []
    return ['***', '本页主题快捷操作：', '', ...table, ...navigation].join('\n')
}


/**
 * @param {botEvent} e
 * @param {{slug:string,name:string,botDownloadAllowed:boolean|null}[]} themes
 * @param {{page?:number,pageCount?:number}} [pagination]
 */
export async function sendMarketQuickCommands(e, themes, pagination = {}) {
    // 旧版测试及无平台上下文的调用仍允许生成 Markdown；真实事件只对 QQ 官方机器人发送。
    if ((e?.bot || e?.platform) && !isOfficialBot(e)) return
    if (!Config.getUserCfg('config', 'LetterMarkdown')) return
    const markdown = buildMarketQuickMarkdown(themes, pagination)
    if (!markdown) return
    try {
        const sent = /** @type {{error?: unknown[]}|undefined} */ (await send.reply(e, segment.markdown(markdown)))
        if (sent?.error?.length) logger.warn('[phi-plugin][主题市场] Markdown 发送失败')
    } catch (error) {
        logger.warn('[phi-plugin][主题市场] Markdown 发送失败', error)
    }
}
