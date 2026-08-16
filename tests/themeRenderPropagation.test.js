import assert from 'node:assert/strict'
import test from 'node:test'
import getNotes from '../model/user/getNotes.js'
import picmodle from '../model/render/picmodle.js'

test('picmodle resolves persisted user theme when render data omits it', async () => {
    const original = getNotes.getNotesData
    getNotes.getNotesData = async () => /** @type {any} */ ({ theme: 'milthm' })
    try {
        const prepared = await picmodle.prepareRenderData({ user_id: 'theme-user' }, { title: 'fixture' })
        assert.equal(prepared.theme, 'milthm')
        assert.equal(prepared.title, 'fixture')
    } finally {
        getNotes.getNotesData = original
    }
})

test('explicit render theme wins over the persisted user theme', async () => {
    const original = getNotes.getNotesData
    getNotes.getNotesData = async () => /** @type {any} */ ({ theme: 'milthm' })
    try {
        const prepared = await picmodle.prepareRenderData({ user_id: 'theme-user' }, {
            theme: 'snow',
        })
        assert.equal(prepared.theme, 'snow')
    } finally {
        getNotes.getNotesData = original
    }
})

test('common forwards the resolved theme to the concrete render target', async () => {
    const originalNotes = getNotes.getNotesData
    const originalRender = picmodle.render
    /** @type {any[]} */ const calls = []
    getNotes.getNotesData = async () => /** @type {any} */ ({ theme: 'milthm' })
    picmodle.render = /** @type {any} */ (async (/** @type {any[]} */ ...args) => {
        calls.push(args)
        return 'image'
    })
    try {
        await picmodle.common({ user_id: 'theme-user' }, 'rankingList', { title: 'fixture' })
        assert.equal(calls.length, 1)
        assert.equal(calls[0][0], 'rankingList/rankingList')
        assert.equal(calls[0][1].theme, 'milthm')
    } finally {
        getNotes.getNotesData = originalNotes
        picmodle.render = originalRender
    }
})
