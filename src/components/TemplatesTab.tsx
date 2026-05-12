'use client'

import { useMemo, useRef, useState } from 'react'
import type { EmailTemplate } from '@/types'
import { TEMPLATE_VARIABLES, newTemplate } from '@/lib/templates'
import RichTextEditor from './RichTextEditor'

interface TemplatesTabProps {
  templates: EmailTemplate[]
  onChange: (next: EmailTemplate[]) => void
}

export default function TemplatesTab({ templates, onChange }: TemplatesTabProps) {
  const [selectedId, setSelectedId] = useState<string | null>(
    templates[0]?.id ?? null
  )
  const [subjectVarOpen, setSubjectVarOpen] = useState(false)
  const subjectRef = useRef<HTMLInputElement | null>(null)

  const selected = useMemo(
    () => templates.find(t => t.id === selectedId) ?? null,
    [templates, selectedId]
  )

  const patch = (changes: Partial<EmailTemplate>) => {
    if (!selected) return
    onChange(
      templates.map(t => (t.id === selected.id ? { ...t, ...changes } : t))
    )
  }

  const handleCreate = () => {
    const t = newTemplate()
    onChange([...templates, t])
    setSelectedId(t.id)
  }

  const handleDelete = () => {
    if (!selected) return
    if (!confirm(`Delete template "${selected.name}"?`)) return
    const next = templates.filter(t => t.id !== selected.id)
    onChange(next)
    setSelectedId(next[0]?.id ?? null)
  }

  const handleDuplicate = () => {
    if (!selected) return
    const copy: EmailTemplate = {
      ...selected,
      id: newTemplate().id,
      name: `${selected.name} (copy)`,
    }
    onChange([...templates, copy])
    setSelectedId(copy.id)
  }

  const insertIntoSubject = (key: string) => {
    if (!selected) return
    const input = subjectRef.current
    const placeholder = `{{${key}}}`
    if (!input) {
      patch({ subject: `${selected.subject}${placeholder}` })
    } else {
      const start = input.selectionStart ?? selected.subject.length
      const end = input.selectionEnd ?? selected.subject.length
      const next =
        selected.subject.slice(0, start) +
        placeholder +
        selected.subject.slice(end)
      patch({ subject: next })
      requestAnimationFrame(() => {
        input.focus()
        input.setSelectionRange(start + placeholder.length, start + placeholder.length)
      })
    }
    setSubjectVarOpen(false)
  }

  const inputCls =
    'w-full bg-[#111] border border-gray-700 rounded px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-purple-500'

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-white">Email Templates</h2>
        <button
          onClick={handleCreate}
          className="bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium px-4 py-2 rounded transition-colors"
        >
          + New Template
        </button>
      </div>

      <div className="grid grid-cols-12 gap-5">
        {/* List */}
        <aside className="col-span-3 bg-[#1a1a1a] border border-gray-800 rounded-lg p-3 max-h-[80vh] overflow-y-auto">
          {templates.length === 0 ? (
            <p className="text-xs text-gray-500 p-2">No templates yet.</p>
          ) : (
            <ul className="flex flex-col gap-1">
              {templates.map(t => (
                <li key={t.id}>
                  <button
                    onClick={() => setSelectedId(t.id)}
                    className={`w-full text-left px-3 py-2 rounded text-sm transition-colors ${
                      selectedId === t.id
                        ? 'bg-purple-900/40 text-white border border-purple-700'
                        : 'text-gray-300 hover:bg-[#222] border border-transparent'
                    }`}
                  >
                    <div className="font-medium truncate">{t.name}</div>
                    <div className="text-xs text-gray-500 truncate">
                      {t.subject}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </aside>

        {/* Editor */}
        <section className="col-span-9 bg-[#1a1a1a] border border-gray-800 rounded-lg p-5">
          {!selected ? (
            <p className="text-sm text-gray-400">
              Select a template on the left or click <strong>+ New Template</strong>.
            </p>
          ) : (
            <>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">
                  Edit Template
                </h3>
                <div className="flex gap-2">
                  <button
                    onClick={handleDuplicate}
                    className="text-xs px-3 py-1.5 rounded border border-gray-700 text-gray-300 hover:bg-[#222]"
                  >
                    Duplicate
                  </button>
                  <button
                    onClick={handleDelete}
                    className="text-xs px-3 py-1.5 rounded border border-red-800 text-red-400 hover:bg-red-900/30"
                  >
                    Delete
                  </button>
                </div>
              </div>

              <label className="block text-xs text-gray-500 mb-1 uppercase tracking-wider">
                Name
              </label>
              <input
                type="text"
                value={selected.name}
                onChange={e => patch({ name: e.target.value })}
                className={`${inputCls} mb-3`}
              />

              <label className="block text-xs text-gray-500 mb-1 uppercase tracking-wider">
                Subject
              </label>
              <div className="flex gap-2 mb-3 items-stretch relative">
                <input
                  ref={subjectRef}
                  type="text"
                  value={selected.subject}
                  onChange={e => patch({ subject: e.target.value })}
                  className={inputCls}
                  placeholder="e.g. Welcome {{first_name}}"
                />
                <button
                  type="button"
                  onClick={() => setSubjectVarOpen(v => !v)}
                  className="text-xs px-3 rounded border border-gray-700 text-gray-300 hover:bg-[#222] whitespace-nowrap"
                >
                  + Variable ▾
                </button>
                {subjectVarOpen && (
                  <div className="absolute z-10 top-full right-0 mt-1 bg-[#1a1a1a] border border-gray-700 rounded shadow-lg min-w-[220px]">
                    {TEMPLATE_VARIABLES.map(v => (
                      <button
                        key={v.key}
                        type="button"
                        onClick={() => insertIntoSubject(v.key)}
                        className="block w-full text-left px-3 py-2 text-xs text-gray-300 hover:bg-[#222] border-b border-gray-800 last:border-b-0"
                      >
                        <span className="font-medium text-white">{v.label}</span>
                        <span className="text-gray-500 ml-2">{`{{${v.key}}}`}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <label className="block text-xs text-gray-500 mb-1 uppercase tracking-wider">
                Message
              </label>
              <RichTextEditor
                value={selected.body}
                onChange={body => patch({ body })}
              />

              <p className="text-xs text-gray-600 mt-3">
                Changes save automatically to this browser. Switch to{' '}
                <strong className="text-gray-400">Preview</strong> inside the
                editor to see how the email will look to recipients.
              </p>
            </>
          )}
        </section>
      </div>
    </div>
  )
}
