import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import test from 'node:test'

const ratingTemplates = [
    'arcgrosB19/arcgrosB19.art',
    'chap/chap.art',
    'historyB30/historyB30.art',
    'list/list.art',
    'lvsco/lvsco.art',
    'rankingList-old/rankingList.art',
    'rankingList/rankingList.art',
    'score/score.art',
    'score/scoreOld.art',
    'score/scoreRankList.art',
    'suggest/suggest.art',
    'table/table.art',
    'update/update.art',
    'userinfo/userinfo-old.art',
    'userinfo/userinfo.art',
]

test('评级图标模板优先使用主题图标并保留默认回退', () => {
    for (const relative of ratingTemplates) {
        const source = fs.readFileSync(path.join('resources/html', relative), 'utf8')
        const imageLines = source
            .split(/\r?\n/)
            .filter(line => /<img/.test(line) && /(Rating|\.rating|rating\.tot|\$index|otherimg\/(?:phi|NEW)\.png)/.test(line))

        assert.ok(imageLines.length > 0, `${relative} 未找到评级图标引用`)
        for (const line of imageLines) {
            assert.match(line, /themeInfo\s*&&\s*themeInfo\.icons/, `${relative} 存在未透传主题图标的评级引用：${line.trim()}`)
            assert.match(line, /(?:_res_path|_imgPath)/, `${relative} 的评级图标缺少默认资源回退：${line.trim()}`)
        }
    }
})
