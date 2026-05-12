'use client'

import { useEditor, EditorContent, Extension } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import { Plugin } from '@tiptap/pm/state'
import { Decoration, DecorationSet } from '@tiptap/pm/view'
import { useEffect, useState } from 'react'
import {
  TEMPLATE_VARIABLES,
  PREVIEW_SAMPLE_VALUES,
  buildEmailShell,
  renderTemplate,
} from '@/lib/templates'

const VARIABLE_REGEX = /\{\{\s*\w+\s*\}\}/g

const VariableHighlight = Extension.create({
  name: 'variableHighlight',
  addProseMirrorPlugins() {
    return [
      new Plugin({
        props: {
          decorations(state) {
            const decorations: Decoration[] = []
            state.doc.descendants((node, pos) => {
              if (!node.isText) return
              const text = node.text ?? ''
              let m: RegExpExecArray | null
              VARIABLE_REGEX.lastIndex = 0
              while ((m = VARIABLE_REGEX.exec(text)) !== null) {
                const from = pos + m.index
                const to = from + m[0].length
                decorations.push(
                  Decoration.inline(from, to, { class: 'variable-chip' })
                )
              }
            })
            return DecorationSet.create(state.doc, decorations)
          },
        },
      }),
    ]
  },
})

interface RichTextEditorProps {
  value: string
  onChange: (html: string) => void
}

export default function RichTextEditor({ value, onChange }: RichTextEditorProps) {
  const [mode, setMode] = useState<'edit' | 'preview'>('edit')
  const [variableMenuOpen, setVariableMenuOpen] = useState(false)

  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { rel: 'noopener noreferrer' },
      }),
      VariableHighlight,
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
    editorProps: {
      attributes: {
        class: 'tiptap-editor-area',
      },
    },
    immediatelyRender: false,
  })

  useEffect(() => {
    if (!editor) return
    if (editor.getHTML() !== value) {
      editor.commands.setContent(value, { emitUpdate: false })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, editor])

  if (!editor) return null

  const insertVariable = (key: string) => {
    editor.chain().focus().insertContent(`{{${key}}}`).run()
    setVariableMenuOpen(false)
  }

  const promptLink = () => {
    const prev = editor.getAttributes('link').href as string | undefined
    const url = window.prompt('Link URL', prev ?? 'https://')
    if (url === null) return
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
      return
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
  }

  const previewHtml = buildEmailShell(
    renderTemplate(value, PREVIEW_SAMPLE_VALUES, true)
  )

  const btnCls = (active = false, disabled = false) =>
    `px-2.5 py-1 rounded text-xs font-medium transition-colors ${
      disabled
        ? 'text-gray-700 cursor-not-allowed'
        : active
        ? 'bg-purple-900/50 text-purple-200 border border-purple-700'
        : 'text-gray-300 hover:bg-[#222] border border-transparent'
    }`

  return (
    <div className="border border-gray-700 rounded overflow-hidden bg-[#111]">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 px-2 py-1.5 border-b border-gray-800 bg-[#161616]">
        <button
          type="button"
          onClick={() => setMode('edit')}
          className={btnCls(mode === 'edit')}
        >
          Edit
        </button>
        <button
          type="button"
          onClick={() => setMode('preview')}
          className={btnCls(mode === 'preview')}
        >
          Preview
        </button>

        <span className="w-px h-5 bg-gray-800 mx-1" />

        <button
          type="button"
          disabled={mode !== 'edit'}
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={btnCls(editor.isActive('bold'), mode !== 'edit')}
          title="Bold (Ctrl+B)"
        >
          <strong>B</strong>
        </button>
        <button
          type="button"
          disabled={mode !== 'edit'}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={btnCls(editor.isActive('italic'), mode !== 'edit')}
          title="Italic (Ctrl+I)"
        >
          <em>I</em>
        </button>
        <button
          type="button"
          disabled={mode !== 'edit'}
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className={btnCls(editor.isActive('strike'), mode !== 'edit')}
          title="Strikethrough"
        >
          <s>S</s>
        </button>

        <span className="w-px h-5 bg-gray-800 mx-1" />

        <button
          type="button"
          disabled={mode !== 'edit'}
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 2 }).run()
          }
          className={btnCls(
            editor.isActive('heading', { level: 2 }),
            mode !== 'edit'
          )}
          title="Heading"
        >
          H
        </button>
        <button
          type="button"
          disabled={mode !== 'edit'}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={btnCls(editor.isActive('bulletList'), mode !== 'edit')}
          title="Bullet list"
        >
          • List
        </button>
        <button
          type="button"
          disabled={mode !== 'edit'}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={btnCls(editor.isActive('orderedList'), mode !== 'edit')}
          title="Numbered list"
        >
          1. List
        </button>
        <button
          type="button"
          disabled={mode !== 'edit'}
          onClick={promptLink}
          className={btnCls(editor.isActive('link'), mode !== 'edit')}
          title="Link"
        >
          🔗 Link
        </button>

        <span className="w-px h-5 bg-gray-800 mx-1" />

        <div className="relative">
          <button
            type="button"
            disabled={mode !== 'edit'}
            onClick={() => setVariableMenuOpen(v => !v)}
            className={btnCls(false, mode !== 'edit')}
            title="Insert variable"
          >
            + Variable ▾
          </button>
          {variableMenuOpen && mode === 'edit' && (
            <div className="absolute z-10 mt-1 left-0 bg-[#1a1a1a] border border-gray-700 rounded shadow-lg min-w-[220px]">
              {TEMPLATE_VARIABLES.map(v => (
                <button
                  key={v.key}
                  type="button"
                  onClick={() => insertVariable(v.key)}
                  className="block w-full text-left px-3 py-2 text-xs text-gray-300 hover:bg-[#222] border-b border-gray-800 last:border-b-0"
                >
                  <span className="font-medium text-white">{v.label}</span>
                  <span className="text-gray-500 ml-2">{`{{${v.key}}}`}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Body: Edit or Preview */}
      {mode === 'edit' ? (
        <div className="tiptap-editor">
          <EditorContent editor={editor} />
        </div>
      ) : (
        <iframe
          srcDoc={previewHtml}
          sandbox=""
          className="w-full bg-white"
          style={{ height: 460, border: 0 }}
          title="Email preview"
        />
      )}
    </div>
  )
}
