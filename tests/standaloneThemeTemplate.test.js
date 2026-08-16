import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import test from 'node:test'
import { pluginResources } from '../model/filesystem/path.js'

const standaloneTemplates = [
    ['chartInfo', 'chartInfo'],
    ['guess', 'guess'],
    ['score', 'scoreOld'],
]

test('standalone render templates consume page theme assets', () => {
    for (const [app, template] of standaloneTemplates) {
        const source = fs.readFileSync(path.join(pluginResources, 'html', app, `${template}.art`), 'utf8')
        assert.match(source, /themeInfo\.cssUrl/)
        assert.match(source, /themeInfo\.fontUrl/)
        assert.match(source, /themeInfo\.colors/)
        assert.match(source, /themeInfo\.backgroundUrl/)
    }
})
