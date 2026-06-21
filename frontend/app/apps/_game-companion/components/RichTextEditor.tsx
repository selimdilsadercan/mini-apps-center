'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { TextB, TextItalic, ListBullets, ListNumbers, Quotes, ArrowCounterClockwise, ArrowClockwise } from '@phosphor-icons/react';

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
}

export default function RichTextEditor({ content, onChange, placeholder = "İçeriği yazın..." }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder,
      }),
    ],
    content,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none min-h-[120px] p-3 text-gray-900',
        style: 'color: #111827;',
      },
    },
  });

  if (!editor) {
    return null;
  }

  const ToolbarButton = ({ onClick, isActive, children, title }: { onClick: () => void; isActive?: boolean; children: React.ReactNode; title: string }) => (
    <button
      onClick={onClick}
      title={title}
      className={`p-2 rounded hover:bg-gray-100 ${isActive ? 'bg-gray-200 text-gray-900' : 'text-gray-600'}`}
    >
      {children}
    </button>
  );

  return (
    <div className="border border-gray-300 rounded-lg overflow-hidden">
      <style jsx global>{`
        .ProseMirror ul {
          list-style-type: disc !important;
          margin-left: 1.5rem !important;
          padding-left: 0 !important;
        }
        .ProseMirror ol {
          list-style-type: decimal !important;
          margin-left: 1.5rem !important;
          padding-left: 0 !important;
        }
        .ProseMirror li {
          display: list-item !important;
          margin-bottom: 0.25rem !important;
        }
        .ProseMirror ul li::marker {
          color: #374151 !important;
        }
        .ProseMirror ol li::marker {
          color: #374151 !important;
        }
        .ProseMirror blockquote {
          border-left: 4px solid #d1d5db !important;
          padding-left: 1rem !important;
          margin: 1rem 0 !important;
          font-style: italic !important;
          color: #6b7280 !important;
        }
        .ProseMirror {
          color: #111827 !important;
          font-size: 1rem !important;
          line-height: 1.5 !important;
        }
      `}</style>
      {/* Toolbar */}
      <div className="flex items-center space-x-1 p-2 bg-gray-50 border-b border-gray-200">
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          isActive={editor.isActive('bold')}
          title="Kalın"
        >
          <TextB size={16} weight="regular" />
        </ToolbarButton>
        
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          isActive={editor.isActive('italic')}
          title="İtalik"
        >
          <TextItalic size={16} weight="regular" />
        </ToolbarButton>
        
        <div className="w-px h-6 bg-gray-300 mx-1" />
        
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          isActive={editor.isActive('bulletList')}
          title="Madde İşareti"
        >
          <ListBullets size={16} weight="regular" />
        </ToolbarButton>
        
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          isActive={editor.isActive('orderedList')}
          title="Numaralı Liste"
        >
          <ListNumbers size={16} weight="regular" />
        </ToolbarButton>
        
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          isActive={editor.isActive('blockquote')}
          title="Alıntı"
        >
          <Quotes size={16} weight="regular" />
        </ToolbarButton>
        
        <div className="w-px h-6 bg-gray-300 mx-1" />
        
        <ToolbarButton
          onClick={() => editor.chain().focus().undo().run()}
          title="Geri Al"
        >
          <ArrowCounterClockwise size={16} weight="regular" />
        </ToolbarButton>
        
        <ToolbarButton
          onClick={() => editor.chain().focus().redo().run()}
          title="Yinele"
        >
          <ArrowClockwise size={16} weight="regular" />
        </ToolbarButton>
      </div>
      
      {/* Editor Content */}
      <div className="min-h-[120px]">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
