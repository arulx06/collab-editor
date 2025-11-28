'use client'

import { useState, useEffect } from 'react'
import { useEditor, EditorContent, Editor as TipTapEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { TaskList } from '@tiptap/extension-task-list'
import Table from '@tiptap/extension-table'
import TableCell from '@tiptap/extension-table-cell'
import TableHeader from '@tiptap/extension-table-header'
import TableRow from '@tiptap/extension-table-row'
import TaskItem from '@tiptap/extension-task-item'
import ImageResize from 'tiptap-extension-resize-image'
import Image from '@tiptap/extension-image'
import { Underline } from '@tiptap/extension-underline'
import { FontFamily } from '@tiptap/extension-font-family'
import TextStyle from '@tiptap/extension-text-style'
import { Color } from '@tiptap/extension-color'
import Highlight from '@tiptap/extension-highlight'
import Link from '@tiptap/extension-link'
import TextAlign from '@tiptap/extension-text-align'

import { useEditorStore } from '@/store/use-editor-store'
import { FontSizeExtensions } from '@/extensions/font-size'
import { lineHeightExtension } from '@/extensions/line-height'

import { useLiveblocksExtension } from '@liveblocks/react-tiptap'
import { useStorage } from '@liveblocks/react'

import { Ruler } from './ruler'
import { Threads } from './threads'

const DEFAULT_MARGIN = 56

interface EditorProps {
  initialContent?: string
}

export const Editor = ({ initialContent }: EditorProps) => {
  const liveLeftMargin = useStorage((root) => root.leftMargin) ?? DEFAULT_MARGIN
  const liveRightMargin = useStorage((root) => root.rightMargin) ?? DEFAULT_MARGIN

  const [leftMargin, setLeftMargin] = useState<number>(liveLeftMargin)
  const [rightMargin, setRightMargin] = useState<number>(liveRightMargin)

  const LiveBlocks = useLiveblocksExtension({
    initialContent,
    offlineSupport_experimental: true,
  })
  const { setEditor } = useEditorStore()

  const editor = useEditor({
    immediatelyRender: false,
    onCreate({ editor }: { editor: TipTapEditor }) {
      setEditor(editor)
      updateEditorPadding(editor, leftMargin, rightMargin)
    },
    onUpdate({ editor }: { editor: TipTapEditor }) {
      setEditor(editor)
      updateEditorPadding(editor, leftMargin, rightMargin)
    },
    editorProps: {
      attributes: {
        class:
          'focus:outline-none print:border-0 bg-white border border-[#C7C7C7] flex flex-col min-h-[1054px] w-full pt-10 pr-14 pb-10 cursor-text',
      },
    },
    extensions: [
      LiveBlocks,
      StarterKit.configure({ history: false }),
      Underline,
      TaskItem.configure({ nested: true }),
      TaskList,
      Table,
      TableCell,
      TableHeader,
      TableRow,
      Image,
      ImageResize,
      FontFamily,
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
      Link.configure({ openOnClick: true, autolink: true, defaultProtocol: 'https' }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      FontSizeExtensions,
      lineHeightExtension.configure({ types: ['heading', 'paragraph'], defaultLineHeight: 'normal' }),
    ],
    content: initialContent ?? '',
  })

  // Update editor padding when Liveblocks values change
  useEffect(() => setLeftMargin(liveLeftMargin), [liveLeftMargin])
  useEffect(() => setRightMargin(liveRightMargin), [liveRightMargin])
  useEffect(() => {
    if (editor) updateEditorPadding(editor, leftMargin, rightMargin)
  }, [leftMargin, rightMargin, editor])

  const updateEditorPadding = (editorInstance: TipTapEditor, left: number, right: number) => {
    if (!editorInstance?.view?.dom) return
    const dom = editorInstance.view.dom as HTMLElement
    dom.style.paddingLeft = `${left}px`
    dom.style.paddingRight = `${right}px`
  }

  return (
    <div className="size-full overflow-x-auto bg-[#F9FBFD] px-4 print:p-0 print:bg-white print:overflow-visible">
      <Ruler
        leftMargin={leftMargin}
        rightMargin={rightMargin}
        onMarginChange={(left: number, right: number) => {
          setLeftMargin(left)
          setRightMargin(right)
        }}
      />

      {/* Editor wrapper */}
      <div className="w-[816px] mx-auto py-4 print:py-0 relative">
        <EditorContent editor={editor} className="bg-white min-h-[1054px] w-full" />
        <Threads editor={editor} />
      </div>
    </div>
  )
}
