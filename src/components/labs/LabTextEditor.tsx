import { useEffect, useState } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { TextStyle, FontSize } from '@tiptap/extension-text-style';
import { Bold, Italic, Underline } from 'lucide-react';
import { Toggle } from '@/components/ui/toggle';
import { Input } from '@/components/ui/input';

export type EditedLabText = { text: string; html: string };
export function LabTextEditor({ text, resetKey, en, onChange }: { text: string; resetKey: number; en: boolean; onChange: (value: EditedLabText) => void }) {
  const [size, setSize] = useState('10');
  const [, refresh] = useState(0);
  const editor = useEditor({
    extensions: [StarterKit.configure({ heading: false, link: false }), TextStyle, FontSize],
    immediatelyRender: false,
    editorProps: { attributes: { class: 'lab-text-editor', role: 'textbox', 'aria-label': 'Text sistematizat', 'aria-multiline': 'true' } },
    onUpdate: ({ editor: current }) => onChange({ text: current.getText({ blockSeparator: '\n\n' }), html: current.getHTML() }),
    onTransaction: () => refresh(n => n + 1),
    onSelectionUpdate: ({ editor: current }) => setSize(String(parseFloat(current.getAttributes('textStyle').fontSize || '10'))),
  });
  useEffect(() => {
    if (!editor) return;
    editor.commands.setContent({ type: 'doc', content: text.split('\n\n').map(paragraph => ({ type: 'paragraph', ...(paragraph ? { content: [{ type: 'text', text: paragraph }] } : {}) })) }, { emitUpdate: false });
    setSize('10');
  }, [editor, text, resetKey]);
  return <div className="overflow-hidden rounded-md border bg-card">
    <div className="flex flex-wrap items-center gap-1 border-b bg-surface px-2 py-1.5">
      <span className="px-2 text-sm">Arial</span>
      <label className="mr-2 flex items-center gap-1 text-xs">
        <Input type="number" min="6" max="72" step="1" aria-label={en ? 'Font size' : 'Dimensiune text'} value={size} className="h-8 w-16 bg-background text-sm" disabled={!editor} onChange={e => {
          const value = e.target.value; setSize(value);
          const number = Number(value);
          if (editor && number >= 6 && number <= 72) editor.chain().focus().setFontSize(`${number}pt`).run();
        }} onBlur={() => { if (!size || Number(size) < 6 || Number(size) > 72) setSize('10'); }} />pt
      </label>
      <Toggle size="sm" pressed={editor?.isActive('bold') ?? false} disabled={!editor} title={en ? 'Bold' : 'Aldin'} aria-label={en ? 'Bold' : 'Aldin'} onMouseDown={e => e.preventDefault()} onPressedChange={() => editor?.chain().focus().toggleBold().run()}><Bold /></Toggle>
      <Toggle size="sm" pressed={editor?.isActive('italic') ?? false} disabled={!editor} title={en ? 'Italic' : 'Cursiv'} aria-label={en ? 'Italic' : 'Cursiv'} onMouseDown={e => e.preventDefault()} onPressedChange={() => editor?.chain().focus().toggleItalic().run()}><Italic /></Toggle>
      <Toggle size="sm" pressed={editor?.isActive('underline') ?? false} disabled={!editor} title={en ? 'Underline' : 'Subliniat'} aria-label={en ? 'Underline' : 'Subliniat'} onMouseDown={e => e.preventDefault()} onPressedChange={() => editor?.chain().focus().toggleUnderline().run()}><Underline /></Toggle>
    </div>
    <EditorContent editor={editor} />
  </div>;
}