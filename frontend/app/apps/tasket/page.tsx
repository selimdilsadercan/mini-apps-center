"use client";

import { useState, useEffect, useMemo, useCallback, forwardRef, useImperativeHandle } from "react";
import { createRoot } from "react-dom/client";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Plus,
  Trash,
  ListChecks,
  X,
  Folder,
  DotsThreeVertical,
  CheckCircle,
  TextHOne,
  TextHTwo,
  TextHThree,
  ListBullets,
  ListNumbers,
  Quotes,
  Minus,
  Image as ImageIcon,
  Paperclip,
  Microphone,
  Sparkle,
  CalendarBlank,
  User,
  UserCircle,
  Clock,
  Tag,
  Check,
  ArrowElbowDownLeft,
  DotsSixVertical,
  TextT,
} from "@phosphor-icons/react";
import { motion, AnimatePresence } from "framer-motion";
import { createBrowserClient } from "@/lib/api";
import { useUser } from "@clerk/clerk-react";
import { useLanguage, useTranslations } from "@/contexts/LanguageContext";
import { useEditor, EditorContent, ReactNodeViewRenderer, NodeViewWrapper, NodeViewContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import TaskItem from "@tiptap/extension-task-item";
import TaskList from "@tiptap/extension-task-list";
import Paragraph from "@tiptap/extension-paragraph";
import Heading from "@tiptap/extension-heading";
import { Extension, Node, mergeAttributes } from "@tiptap/core";
import { Plugin, PluginKey, NodeSelection, TextSelection } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";
import Suggestion from "@tiptap/suggestion";
import tippy, { Instance as TippyInstance } from "tippy.js";
import * as Popover from "@radix-ui/react-popover";

import * as Tooltip from "@radix-ui/react-tooltip";
import { parseDateKeyword, formatDateToISO, DATE_KEYWORDS } from "@/lib/date-utils";

const client = createBrowserClient();

const SlashCommand = Extension.create({
  name: "slashCommand",

  addOptions() {
    return {
      suggestion: {
        char: "/",
        command: ({ editor, range, props }: any) => {
          props.command({ editor, range });
        },
      },
    };
  },

  addProseMirrorPlugins() {
    return [
      Suggestion({
        pluginKey: new PluginKey("slashCommand"),
        editor: this.editor,
        ...this.options.suggestion,
      }),
    ];
  },
});

const DateMenuList = forwardRef((props: any, ref) => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const selectItem = (index: number) => {
    const item = props.items[index];
    if (item) {
      props.command(item);
    }
  };

  useEffect(() => {
    setSelectedIndex(0);
  }, [props.items]);

  useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }: { event: KeyboardEvent }) => {
      if (event.key === "ArrowUp") {
        setSelectedIndex((selectedIndex + props.items.length - 1) % props.items.length);
        return true;
      }
      if (event.key === "ArrowDown") {
        setSelectedIndex((selectedIndex + 1) % props.items.length);
        return true;
      }
      if (event.key === "Enter") {
        selectItem(selectedIndex);
        return true;
      }
      return false;
    },
  }));

  return (
    <div className="bg-slate-900 text-white border border-slate-800 shadow-2xl rounded-2xl p-1 overflow-hidden flex flex-col min-w-[180px] z-[1000] animate-in fade-in zoom-in duration-200">
      {props.items.map((item: any, index: number) => (
        <button
          key={index}
          onClick={() => selectItem(index)}
          className={`flex items-center justify-between gap-3 px-3 py-2 text-xs font-black uppercase tracking-widest rounded-xl transition-colors text-left w-full ${
            index === selectedIndex
              ? "bg-white/10 text-white"
              : "text-slate-400 hover:bg-white/5 hover:text-white"
          }`}
        >
          <div className="flex items-center gap-2">
            <CalendarBlank size={14} weight="fill" className="text-teal-400" />
            <span>{item.title}</span>
          </div>
          <ArrowElbowDownLeft size={14} className="opacity-40" />
        </button>
      ))}
    </div>
  );
});

DateMenuList.displayName = "DateMenuList";

const GlobalKeymap = Extension.create({
  name: "globalKeymap",

  addKeyboardShortcuts() {
    return {
      "Mod-a": ({ editor }) => {
        const { state } = editor;
        const { selection } = state;
        const { $from } = selection;

        // Get the current block node's range
        const start = $from.start($from.depth);
        const end = $from.end($from.depth);

        // If the current selection is already exactly this block, let default select all happen
        if (selection.from === start && selection.to === end) {
          return false;
        }

        editor.commands.setTextSelection({ from: start, to: end });
        return true;
      },
    };
  },
});

const MentionMenuList = forwardRef((props: any, ref) => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const selectItem = (index: number) => {
    const item = props.items[index];
    if (item) {
      props.command(item);
    }
  };

  useEffect(() => {
    setSelectedIndex(0);
  }, [props.items]);

  useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }: { event: KeyboardEvent }) => {
      if (event.key === "ArrowUp") {
        setSelectedIndex((selectedIndex + props.items.length - 1) % props.items.length);
        return true;
      }
      if (event.key === "ArrowDown") {
        setSelectedIndex((selectedIndex + 1) % props.items.length);
        return true;
      }
      if (event.key === "Enter") {
        selectItem(selectedIndex);
        return true;
      }
      return false;
    },
  }));

  const people = props.items.filter((item: any) => item.type === 'person');
  const dates = props.items.filter((item: any) => item.type === 'date');

  return (
    <div className="bg-slate-900 text-white border border-slate-800 shadow-2xl rounded-xl p-1 overflow-hidden flex flex-col min-w-[160px] z-[1000] animate-in fade-in zoom-in duration-200">
      {props.items.length > 0 ? (
        <>
          {people.length > 0 && (
            <div className="flex flex-col gap-0.5">
              <div className="px-2 py-1 text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] mb-0.5 mt-1">Kişiler</div>
              {people.map((item: any) => {
                const index = props.items.indexOf(item);
                return (
                  <button
                    key={index}
                    onClick={() => selectItem(index)}
                    className={`flex items-center justify-between gap-2 px-2 py-1.5 text-[11px] font-black uppercase tracking-widest rounded-lg transition-colors text-left w-full ${
                      index === selectedIndex
                        ? "bg-white/10 text-white"
                        : "text-slate-400 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <UserCircle size={12} weight="fill" className="text-indigo-400" />
                      <span>{item.title}</span>
                    </div>
                    <ArrowElbowDownLeft size={10} className="opacity-40" />
                  </button>
                );
              })}
            </div>
          )}
          
          {dates.length > 0 && (
            <div className="flex flex-col gap-0.5">
              <div className="px-2 py-1 text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] mb-0.5 mt-2 border-t border-white/5 pt-2">Tarihler</div>
              {dates.map((item: any) => {
                const index = props.items.indexOf(item);
                return (
                  <button
                    key={index}
                    onClick={() => selectItem(index)}
                    className={`flex items-center justify-between gap-2 px-2 py-1.5 text-[11px] font-black uppercase tracking-widest rounded-lg transition-colors text-left w-full ${
                      index === selectedIndex
                        ? "bg-white/10 text-white"
                        : "text-slate-400 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <CalendarBlank size={12} weight="fill" className="text-teal-400" />
                      <span>{item.title}</span>
                    </div>
                    <ArrowElbowDownLeft size={10} className="opacity-40" />
                  </button>
                );
              })}
            </div>
          )}
        </>
      ) : (
        <div className="px-3 py-2 text-[10px] font-black text-slate-500 uppercase tracking-widest">
          {props.query ? `Ata: ${props.query}` : "İsim veya tarih yazın..."}
        </div>
      )}
    </div>
  );
});

MentionMenuList.displayName = "MentionMenuList";

const renderMentionItems = () => {
  let component: any;
  let popup: any;
  let root: any;

  return {
    onStart: (props: any) => {
      const container = document.createElement("div");
      root = createRoot(container);
      
      component = {
        ref: { current: null },
        render: (props: any) => {
          root.render(<MentionMenuList {...props} ref={component.ref} />);
        },
      };

      component.render(props);

      popup = tippy(document.body, {
        getReferenceClientRect: props.clientRect,
        appendTo: () => document.body,
        content: container,
        showOnCreate: true,
        interactive: true,
        trigger: "manual",
        placement: "bottom-start",
        zIndex: 9999,
      });
    },

    onUpdate(props: any) {
      component.render(props);

      if (!popup || !popup[0]) return;
      popup[0].setProps({
        getReferenceClientRect: props.clientRect,
      });
    },

    onKeyDown(props: any) {
      if (props.event.key === "Escape") {
        popup[0].hide();
        return true;
      }

      return component.ref.current?.onKeyDown(props);
    },

    onExit() {
      if (popup && popup[0]) {
        popup[0].destroy();
      }
      if (root) {
        setTimeout(() => root.unmount(), 0);
      }
    },
  };
};

const MentionSuggestion = Extension.create({
  name: "mentionSuggestion",

  addOptions() {
    return {
      suggestion: {
        char: "@",
        allow: ({ state, range }: any) => {
          const $from = state.doc.resolve(range.from);
          for (let d = $from.depth; d >= 0; d--) {
            if ($from.node(d).type.name === 'taskItem') return true;
          }
          return false;
        },
        render: renderMentionItems,
        command: ({ editor, range, props }: any) => {
          if (props.type === 'person') {
            editor
              .chain()
              .focus()
              .deleteRange(range)
              .updateAttributes("taskItem", { assignee: props.title })
              .run();
          } else if (props.type === 'date') {
            editor
              .chain()
              .focus()
              .deleteRange(range)
              .updateAttributes("taskItem", { dueDate: formatDateToISO(props.date) })
              .run();
          }
        },
        items: ({ query }: { query: string }) => {
          const q = query.toLowerCase();
          
          // People
          const people = ["Selim", "Arda"];
          const matchedPeople = people
            .filter(name => name.toLowerCase().includes(q))
            .map(name => ({ title: name, type: 'person' }));
            
          // Dates
          const matchedDates = DATE_KEYWORDS
            .filter(dk => dk.keywords.some(k => k.toLowerCase().includes(q)))
            .map(dk => ({ title: dk.label, type: 'date', date: dk.getDate() }));

          return [...matchedPeople, ...matchedDates];
        },
      },
    };
  },

  addProseMirrorPlugins() {
    return [
      Suggestion({
        pluginKey: new PluginKey("mentionSuggestion"),
        editor: this.editor,
        ...this.options.suggestion,
      }),
    ];
  },
});

const MenuList = forwardRef((props: any, ref) => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const selectItem = (index: number) => {
    const item = props.items[index];
    if (item) {
      props.command(item);
    }
  };

  useEffect(() => {
    setSelectedIndex(0);
  }, [props.items]);

  useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }: { event: KeyboardEvent }) => {
      if (event.key === "ArrowUp") {
        setSelectedIndex((selectedIndex + props.items.length - 1) % props.items.length);
        return true;
      }
      if (event.key === "ArrowDown") {
        setSelectedIndex((selectedIndex + 1) % props.items.length);
        return true;
      }
      if (event.key === "Enter") {
        selectItem(selectedIndex);
        return true;
      }
      return false;
    },
  }));

  return (
    <div className="bg-white border border-slate-200 shadow-2xl rounded-xl p-1 overflow-hidden flex flex-col min-w-[200px] z-[1000]">
      {props.items.length > 0 ? (
        props.items.map((item: any, index: number) => (
          <button
            key={index}
            onClick={() => selectItem(index)}
            className={`flex items-center gap-3 px-3 py-2 text-sm font-bold rounded-lg transition-colors text-left w-full ${
              index === selectedIndex
                ? "bg-slate-100 text-teal-600"
                : "text-slate-600 hover:bg-slate-50 hover:text-teal-600"
            }`}
          >
            <span className="shrink-0 w-6 flex justify-center">
              {item.icon || "•"}
            </span>
            <span>{item.title}</span>
          </button>
        ))
      ) : (
        <div className="px-3 py-2 text-sm text-slate-400 font-bold">
          {props.emptyMessage || "Sonuç bulunamadı"}
        </div>
      )}
    </div>
  );
});

MenuList.displayName = "MenuList";

const renderItems = (t: any) => {
  let component: any;
  let popup: any;
  let root: any;

  return {
    onStart: (props: any) => {
      const container = document.createElement("div");
      root = createRoot(container);
      
      component = {
        ref: { current: null },
        render: (props: any) => {
          root.render(<MenuList {...props} emptyMessage={t("noResults")} ref={component.ref} />);
        },
      };

      component.render(props);

      popup = tippy("body", {
        getReferenceClientRect: props.clientRect,
        appendTo: () => document.body,
        content: container,
        showOnCreate: true,
        interactive: true,
        trigger: "manual",
        placement: "bottom-start",
      });
    },

    onUpdate(props: any) {
      component.render(props);

      if (!popup || !popup[0]) return;
      popup[0].setProps({
        getReferenceClientRect: props.clientRect,
      });
    },

    onKeyDown(props: any) {
      if (props.event.key === "Escape") {
        popup[0].hide();
        return true;
      }

      return component.ref.current?.onKeyDown(props);
    },

    onExit() {
      if (popup && popup[0]) {
        popup[0].destroy();
      }
      if (root) {
        setTimeout(() => root.unmount(), 0);
      }
    },
  };
};

const BlockHandle = ({ editor, node, getPos, t, className }: any) => {
  const changeNodeType = (type: string) => {
    const pos = getPos();
    const chain = editor.chain().focus().setTextSelection({ from: pos, to: pos + node.nodeSize });
    
    if (type === 'paragraph') chain.setParagraph();
    else if (type === 'h1') chain.toggleHeading({ level: 1 });
    else if (type === 'h2') chain.toggleHeading({ level: 2 });
    else if (type === 'h3') chain.toggleHeading({ level: 3 });
    else if (type === 'task') chain.toggleTaskList();
    
    chain.run();
  };

  const handleDragStart = (e: React.DragEvent) => {
    const { view } = editor;
    const pos = getPos();
    const selection = NodeSelection.create(view.state.doc, pos);
    view.dispatch(view.state.tr.setSelection(selection));
    
    const nodeDOM = view.nodeDOM(pos) as HTMLElement;
    if (nodeDOM) {
      e.dataTransfer.setDragImage(nodeDOM, 0, 10);
    }

    const slice = selection.content();
    const { dom, text } = (view as any).serializeForClipboard(slice);
    
    e.dataTransfer.clearData();
    e.dataTransfer.setData('text/html', dom.innerHTML);
    e.dataTransfer.setData('text/plain', text);
    e.dataTransfer.effectAllowed = 'move';
    
    (view as any).dragging = { slice, move: true };
  };

  const handleDragEnd = () => {
    const { view } = editor;
    const pos = getPos();
    // Clear node selection by setting a text selection
    // We use a small timeout to ensure this happens after the drop logic
    setTimeout(() => {
      if (!editor.isDestroyed) {
        const selection = TextSelection.create(view.state.doc, pos);
        view.dispatch(view.state.tr.setSelection(selection));
      }
    }, 50);
  };

  return (
    <div className={`absolute -left-14 opacity-0 group-hover:opacity-100 flex items-center gap-0.5 z-10 transition-all duration-200 ${className || 'top-1'}`} contentEditable={false}>
      <div 
        draggable 
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        className="cursor-grab active:cursor-grabbing p-1 text-slate-400 hover:text-slate-600 transition-colors"
      >
        <DotsSixVertical size={16} weight="bold" />
      </div>
      
      <Popover.Root>
        <Popover.Trigger asChild>
          <button className="w-5 h-5 rounded-full bg-slate-100 text-slate-500 text-[9px] font-black flex items-center justify-center hover:bg-slate-200 transition-colors shadow-sm">
            {(() => {
              const type = node.type.name;
              if (type === 'heading') return `H${node.attrs.level}`;
              if (type === 'taskItem') return 'T';
              return 'P';
            })()}
          </button>
        </Popover.Trigger>
        <Popover.Portal>
          <Popover.Content className="bg-slate-900 text-white p-1 rounded-xl shadow-2xl border border-slate-800 z-[1000] w-40 animate-in fade-in zoom-in duration-200" side="right" align="start" sideOffset={8}>
            <div className="flex flex-col gap-0.5">
              <button onClick={() => changeNodeType('paragraph')} className="flex items-center gap-2 px-2 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-white/10 transition-colors text-left">
                <TextT size={14} weight="bold" /> {t("toolbar.paragraph") || "Paragraf"}
              </button>
              <button onClick={() => changeNodeType('h1')} className="flex items-center gap-2 px-2 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-white/10 transition-colors text-left">
                <TextHOne size={14} weight="bold" /> {t("toolbar.h1") || "Başlık 1"}
              </button>
              <button onClick={() => changeNodeType('h2')} className="flex items-center gap-2 px-2 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-white/10 transition-colors text-left">
                <TextHTwo size={14} weight="bold" /> {t("toolbar.h2") || "Başlık 2"}
              </button>
              <button onClick={() => changeNodeType('h3')} className="flex items-center gap-2 px-2 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-white/10 transition-colors text-left">
                <TextHThree size={14} weight="bold" /> {t("toolbar.h3") || "Başlık 3"}
              </button>
              <button onClick={() => changeNodeType('task')} className="flex items-center gap-2 px-2 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-white/10 transition-colors text-left">
                <CheckCircle size={14} weight="bold" /> {t("toolbar.task") || "Görev"}
              </button>
            </div>
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>
    </div>
  );
};

const TaskItemView = (props: any) => {
  const { node, updateAttributes, selected, extension, editor, getPos } = props;
  const { checked, assignee, dueDate } = node.attrs;
  const t = extension.options.t;

  const toggleCheck = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    updateAttributes({
      checked: !checked,
    });
  };

  return (
    <NodeViewWrapper className={`flex flex-col group relative py-1 px-0.5 rounded-xl transition-colors ${selected ? 'bg-slate-50' : 'hover:bg-slate-50/50'}`}>
      <BlockHandle editor={editor} node={node} getPos={getPos} t={t} />
      <div className="flex items-start gap-3">
        <div className="mt-1 flex-shrink-0 flex items-center justify-center" contentEditable={false}>
          <button
            onClick={toggleCheck}
            className={`w-5 h-5 rounded-md border-2 transition-all flex items-center justify-center ${
              checked 
                ? 'bg-teal-500 border-teal-500 text-white' 
                : 'border-slate-300 hover:border-teal-400 bg-white'
            }`}
          >
            {checked && <Check size={12} weight="bold" />}
          </button>
        </div>
        
        <div className="flex-1 min-w-0">
          <NodeViewContent 
            className={`outline-none min-h-[1.25rem] py-0.5 ${checked ? 'text-slate-400 line-through' : 'text-slate-700 font-bold'}`} 
          />
          
          <div 
            className={`flex items-center gap-2 px-0.5 transition-all duration-200 overflow-hidden ${
              assignee || dueDate || selected 
                ? 'max-h-8 opacity-100 mt-0.5 mb-0.5' 
                : 'max-h-0 opacity-0 mt-0 mb-0 group-hover:max-h-8 group-hover:opacity-100 group-hover:mt-0.5 group-hover:mb-0.5'
            }`} 
            contentEditable={false}
          >
            <Popover.Root>
              <Popover.Trigger asChild>
                <button className={`flex items-center gap-1.5 px-1.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-tight transition-colors ${dueDate ? 'text-slate-500 bg-slate-100' : 'text-slate-400 hover:bg-slate-100 border border-transparent'}`}>
                  <CalendarBlank size={12} weight="bold" />
                  {dueDate ? new Date(dueDate).toLocaleDateString(undefined, { day: 'numeric', month: 'short' }) : t("task.date")}
                </button>
              </Popover.Trigger>
              <Popover.Portal>
                <Popover.Content className="bg-white p-3 rounded-2xl shadow-2xl border border-slate-100 z-[1000] w-64 animate-in fade-in zoom-in duration-200" sideOffset={5}>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">{t("task.selectDate")}</p>
                  <input 
                    type="date" 
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold focus:outline-none focus:border-teal-500"
                    value={dueDate || ""}
                    onChange={(e) => updateAttributes({ dueDate: e.target.value })}
                  />
                  <div className="flex justify-end mt-3">
                    <button 
                      onClick={() => updateAttributes({ dueDate: null })}
                      className="text-[10px] font-black text-red-500 uppercase hover:bg-red-50 px-2 py-1 rounded-lg"
                    >
                      {t("task.clear")}
                    </button>
                  </div>
                </Popover.Content>
              </Popover.Portal>
            </Popover.Root>

            <Popover.Root>
              <Popover.Trigger asChild>
                <button className={`flex items-center gap-1.5 px-1.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-tight transition-colors ${assignee ? 'text-slate-500 bg-slate-100' : 'text-slate-400 hover:bg-slate-100 border border-transparent'}`}>
                  <UserCircle size={12} weight="bold" />
                  {assignee || t("task.person")}
                </button>
              </Popover.Trigger>
              <Popover.Portal>
                <Popover.Content className="bg-white p-2 rounded-2xl shadow-2xl border border-slate-100 z-[1000] w-48 animate-in fade-in zoom-in duration-200" sideOffset={5}>
                  <p className="px-2 py-1 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">{t("task.assignPerson")}</p>
                  <div className="flex flex-col gap-0.5">
                    {["Selim", "Arda"].map((name) => (
                      <button
                        key={name}
                        onClick={() => updateAttributes({ assignee: name })}
                        className={`flex items-center gap-2 px-2 py-1.5 text-[11px] font-black uppercase tracking-widest rounded-lg transition-colors text-left w-full ${
                          assignee === name
                            ? "bg-slate-100 text-slate-900"
                            : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                        }`}
                      >
                        <UserCircle size={14} weight={assignee === name ? "fill" : "bold"} />
                        <span>{name}</span>
                      </button>
                    ))}
                  </div>
                  <div className="border-t border-slate-100 mt-2 pt-1">
                    <button 
                      onClick={() => updateAttributes({ assignee: null })}
                      className="w-full flex items-center gap-2 px-2 py-1.5 text-[10px] font-black text-red-500 uppercase tracking-widest hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <X size={12} weight="bold" />
                      {t("task.clear")}
                    </button>
                  </div>
                </Popover.Content>
              </Popover.Portal>
            </Popover.Root>
          </div>
        </div>
      </div>
    </NodeViewWrapper>
  );
};

const ParagraphView = (props: any) => {
  const { node, editor, getPos, extension } = props;
  const t = extension?.options?.t || ((key: string) => key);
  return (
    <NodeViewWrapper className="group relative pb-[0.75rem]">
      <BlockHandle editor={editor} node={node} getPos={getPos} t={t} />
      <NodeViewContent className="outline-none" />
    </NodeViewWrapper>
  );
};

const HeadingView = (props: any) => {
  const { node, editor, getPos, extension } = props;
  const t = extension?.options?.t || ((key: string) => key);
  const level = node.attrs.level;
  
  const { paddingClass, topClass } = useMemo(() => {
    if (level === 1) return { paddingClass: "pt-[2rem] pb-[1rem]", topClass: "top-[2.2rem]" };
    if (level === 2) return { paddingClass: "pt-[1.5rem] pb-[0.75rem]", topClass: "top-[1.7rem]" };
    return { paddingClass: "pt-[1.25rem] pb-[0.5rem]", topClass: "top-[1.4rem]" };
  }, [level]);

  return (
    <NodeViewWrapper className={`group relative ${paddingClass}`}>
      <BlockHandle editor={editor} node={node} getPos={getPos} t={t} className={topClass} />
      <NodeViewContent className="outline-none" />
    </NodeViewWrapper>
  );
};

const CustomParagraph = Paragraph.extend<any>({
  addOptions() {
    return {
      ...this.parent?.(),
      t: (key: string) => key,
    }
  },
  addNodeView() {
    return ReactNodeViewRenderer(ParagraphView)
  },
});

const CustomHeading = Heading.extend<any>({
  addOptions() {
    return {
      ...this.parent?.(),
      t: (key: string) => key,
    }
  },
  addNodeView() {
    return ReactNodeViewRenderer(HeadingView)
  },
});

const CustomTaskItem = TaskItem.extend<any>({
  addOptions() {
    return {
      ...this.parent?.(),
      t: (key: string) => key,
    }
  },

  addAttributes() {
    return {
      ...this.parent?.(),
      id: {
        default: null,
        keepOnSplit: false,
        parseHTML: element => element.getAttribute('data-id'),
        renderHTML: attributes => ({
          'data-id': attributes.id || Math.random().toString(36).substring(2, 9),
        }),
      },
      checked: {
        default: false,
        keepOnSplit: false,
        renderHTML: attributes => ({
          'data-checked': attributes.checked,
        }),
        parseHTML: element => element.getAttribute('data-checked') === 'true',
      },
      assignee: {
        default: null,
        keepOnSplit: false,
        renderHTML: attributes => ({
          'data-assignee': attributes.assignee,
        }),
        parseHTML: element => element.getAttribute('data-assignee'),
      },
      dueDate: {
        default: null,
        keepOnSplit: false,
        renderHTML: attributes => ({
          'data-due-date': attributes.dueDate,
        }),
        parseHTML: element => element.getAttribute('data-due-date'),
      },
    }
  },

  addKeyboardShortcuts() {
    return {
      Enter: ({ editor }) => {
        const { state } = editor;
        const { selection } = state;
        const { $from } = selection;

        // Find the closest taskItem
        let taskItemDepth = -1;
        for (let d = $from.depth; d >= 0; d--) {
          if ($from.node(d).type.name === 'taskItem') {
            taskItemDepth = d;
            break;
          }
        }

        if (taskItemDepth !== -1) {
          // 1. Move cursor to the end of the current task item to prevent splitting text
          const endOfContent = $from.end($from.depth);
          editor.commands.setTextSelection(endOfContent);

          // 2. Check if there's another task item after this one
          let nextTaskItemPos = -1;
          const afterTaskItem = $from.after(taskItemDepth);
          
          state.doc.nodesBetween(afterTaskItem, state.doc.content.size, (node, pos) => {
            if (nextTaskItemPos !== -1) return false;
            if (node.type.name === 'taskItem') {
              nextTaskItemPos = pos;
              return false;
            }
          });

          if (nextTaskItemPos !== -1) {
            // Focus next task item (inside its paragraph)
            editor.commands.setTextSelection(nextTaskItemPos + 2);
            return true;
          }

          // 3. If no next item, create a new one
          return editor.commands.splitListItem('taskItem');
        }

        return false;
      },
    }
  },

  addProseMirrorPlugins() {
    return []; // Removed highlight plugin to avoid interference with popup
  },

  addNodeView() {
    return ReactNodeViewRenderer(TaskItemView)
  },
})

function debounce(fn: Function, ms: number) {
  let timeoutId: ReturnType<typeof setTimeout>;
  return function(this: any, ...args: any[]) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn.apply(this, args), ms);
  };
}

interface TasketList {
  id: string;
  name: string;
  content: any;
  color: string | null;
  icon: string | null;
}

export default function TasketApp() {
  const router = useRouter();
  const { user, isLoaded: isUserLoaded } = useUser();
  const { locale } = useLanguage();
  const t = useTranslations("tasket");

  const getSuggestionItems = useCallback(({ query }: { query: string }) => {
    const items = [
      {
        title: "Görev",
        searchTerms: ["task", "todo", "gorev", "check"],
        icon: <CheckCircle size={18} weight="bold" />,
        command: ({ editor, range }: any) => {
          editor.chain().focus().deleteRange(range).toggleTaskList().run();
        },
      },
      {
        title: t("slashCommands.h1"),
        searchTerms: ["h1", "heading 1", "baslik 1"],
        icon: <TextHOne size={18} weight="bold" />,
        command: ({ editor, range }: any) => {
          editor.chain().focus().deleteRange(range).toggleHeading({ level: 1 }).run();
        },
      },
      {
        title: t("slashCommands.h2"),
        searchTerms: ["h2", "heading 2", "baslik 2"],
        icon: <TextHTwo size={18} weight="bold" />,
        command: ({ editor, range }: any) => {
          editor.chain().focus().deleteRange(range).toggleHeading({ level: 2 }).run();
        },
      },
      {
        title: t("slashCommands.h3"),
        searchTerms: ["h3", "heading 3", "baslik 3"],
        icon: <TextHThree size={18} weight="bold" />,
        command: ({ editor, range }: any) => {
          editor.chain().focus().deleteRange(range).toggleHeading({ level: 3 }).run();
        },
      },
      {
        title: t("slashCommands.bulletList"),
        searchTerms: ["bullet", "list", "madde", "liste"],
        icon: <ListBullets size={18} weight="bold" />,
        command: ({ editor, range }: any) => {
          editor.chain().focus().deleteRange(range).toggleBulletList().run();
        },
      },
      {
        title: t("slashCommands.orderedList"),
        searchTerms: ["number", "ordered", "numara", "liste"],
        icon: <ListNumbers size={18} weight="bold" />,
        command: ({ editor, range }: any) => {
          editor.chain().focus().deleteRange(range).toggleOrderedList().run();
        },
      },
      {
        title: t("slashCommands.quote"),
        searchTerms: ["quote", "blockquote", "alinti"],
        icon: <Quotes size={18} weight="bold" />,
        command: ({ editor, range }: any) => {
          editor.chain().focus().deleteRange(range).toggleBlockquote().run();
        },
      },
    ];

    return items.filter(item => {
      const q = query.toLowerCase();
      return (
        item.title.toLowerCase().includes(q) ||
        item.searchTerms.some(term => term.toLowerCase().includes(q))
      );
    });
  }, [t]);
  
  const [lists, setLists] = useState<TasketList[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedListId, setSelectedListId] = useState<string | null>(null);
  const [showAddListModal, setShowAddListModal] = useState(false);
  const [newListName, setNewListName] = useState("");
  const [newListColor, setNewListColor] = useState("#6366F1");
  const [showMenu, setShowMenu] = useState(false);

  const activeList = useMemo(() => {
    return lists.find(l => l.id === selectedListId);
  }, [lists, selectedListId]);

  const debouncedUpdate = useMemo(
    () =>
      debounce(async (userId: string, listId: string, name: string, content: any) => {
        try {
          await client.tasket.upsertList({
            userId,
            id: listId,
            name: name,
            content: content,
          });
        } catch (err) {
          console.error("Failed to auto-save:", err);
        }
      }, 1000),
    []
  );

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        paragraph: false,
        heading: false,
      }),
      CustomParagraph.configure({
        t: t,
      }),
      CustomHeading.configure({
        t: t,
      }),
      Placeholder.configure({
        placeholder: t("placeholder"),
      }),
      TaskList,
      CustomTaskItem.configure({
        nested: true,
        t: t,
      }),
      SlashCommand.configure({
        suggestion: {
          items: getSuggestionItems,
          render: () => renderItems(t),
        },
      }),
      MentionSuggestion.configure(),
      GlobalKeymap,
    ] as any[],
    content: activeList?.content || "",
    onUpdate: ({ editor }) => {
      if (selectedListId && user?.id && activeList) {
        debouncedUpdate(user.id, selectedListId, activeList.name, editor.getJSON());
      }
    },
    editorProps: {
      attributes: {
        class: "focus:outline-none max-w-none min-h-[500px] text-slate-800",
      },
    },
  });

  useEffect(() => {
    if (!editor || editor.isDestroyed) return;

    if (!activeList) {
      setTimeout(() => {
        if (!editor.isDestroyed) {
          editor.commands.setContent("");
        }
      }, 0);
      return;
    }

    const currentContent = JSON.stringify(editor.getJSON());
    const newContent = JSON.stringify(activeList.content);

    if (currentContent !== newContent) {
      setTimeout(() => {
        if (!editor.isDestroyed) {
          editor.commands.setContent(activeList.content, { emitUpdate: false });
        }
      }, 0);
    }
  }, [activeList, editor]);

  const fetchData = async () => {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }
    try {
      setIsLoading(true);
      const res = await client.tasket.getData(user.id);
      setLists(res.lists);
      if (res.lists.length > 0 && !selectedListId) {
        setSelectedListId(res.lists[0].id);
      }
    } catch (err) {
      console.error("Failed to load tasket data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isUserLoaded) {
      fetchData();
    }
  }, [isUserLoaded, user?.id]);

  const handleCreateList = async () => {
    if (!user?.id || !newListName.trim()) return;
    try {
      const res = await client.tasket.upsertList({
        userId: user.id,
        name: newListName,
        color: newListColor,
        content: { type: "doc", content: [] },
      });
      setLists([...lists, res.list]);
      setSelectedListId(res.list.id);
      setNewListName("");
      setShowAddListModal(false);
    } catch (err) {
      console.error("Failed to create list:", err);
    }
  };

  const deleteList = async (id: string) => {
    if (!user?.id) return;
    if (!confirm(t("deleteConfirm"))) return;
    try {
      await client.tasket.deleteList(id, user.id);
      const newLists = lists.filter(l => l.id !== id);
      setLists(newLists);
      if (selectedListId === id) {
        setSelectedListId(newLists.length > 0 ? newLists[0].id : null);
      }
    } catch (err) {
      console.error("Failed to delete list:", err);
    }
  };

  if (!isUserLoaded) return null;

  return (
    <div className="flex min-h-screen bg-white text-slate-900 font-sans selection:bg-indigo-100">
      {/* Sidebar */}
      <aside className="w-72 bg-[#FBFBFA] border-r border-slate-200 flex flex-col hidden md:flex">
        <div className="p-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-teal-500 flex items-center justify-center text-white shadow-sm">
              <ListChecks size={20} weight="bold" />
            </div>
            <h1 className="text-sm font-black tracking-tight uppercase text-slate-700">Tasket</h1>
          </div>
          <button
            onClick={() => setShowAddListModal(true)}
            className="p-1.5 hover:bg-slate-200 rounded-md text-slate-500 transition-colors"
          >
            <Plus size={18} weight="bold" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 space-y-0.5">
          <div className="py-2">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-3 mb-2">{t("myPages")}</p>
            {isLoading ? (
              <div className="px-3 space-y-2">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-8 bg-slate-100 rounded-lg animate-pulse w-full" />
                ))}
              </div>
            ) : (
              lists.map(list => (
                <div key={list.id} className="group relative">
                  <button
                    onClick={() => setSelectedListId(list.id)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-bold transition-all text-left ${selectedListId === list.id ? "bg-slate-200 text-slate-900" : "text-slate-600 hover:bg-slate-100"}`}
                  >
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: list.color || "#6366F1" }} />
                    <span className="truncate flex-1">{list.name}</span>
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteList(list.id); }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 p-1 hover:bg-slate-300 rounded text-slate-400 hover:text-red-500 transition-all"
                  >
                    <Trash size={14} />
                  </button>
                </div>
              ))
            )}
          </div>
        </nav>

        <div className="p-4 border-t border-slate-100">
          <button
            onClick={() => router.back()}
            className="w-full flex items-center gap-2 text-slate-400 hover:text-slate-600 text-xs font-bold transition-all px-3 py-2"
          >
            <ArrowLeft size={14} weight="bold" />
            {t("backToHome")}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main 
        className="flex-1 flex flex-col h-screen overflow-hidden relative"
      >
        {/* Header */}
        <header className="h-14 flex items-center justify-between px-8 shrink-0">
          <div className="flex items-center gap-4">
            <button className="md:hidden p-2 hover:bg-slate-100 rounded-lg text-slate-500" onClick={() => router.back()}>
              <ArrowLeft size={20} weight="bold" />
            </button>
            <nav className="flex items-center text-xs font-bold text-slate-400 gap-2">
              <span>{t("title")}</span>
              <span>/</span>
              <span className="text-slate-600">{activeList?.name || t("untitled")}</span>
            </nav>
          </div>

          <div className="flex items-center gap-2">
            <button className="p-2 hover:bg-slate-100 rounded-lg text-slate-400">
              <DotsThreeVertical size={20} weight="bold" />
            </button>
          </div>
        </header>

        {/* Editor Area */}
        <div className="flex-1 overflow-y-auto px-16 md:px-24 lg:px-40 py-10">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-full">
              <div className="relative">
                <div className="w-12 h-12 border-4 border-teal-100 border-t-teal-500 rounded-full animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Sparkle size={16} className="text-teal-400 animate-pulse" />
                </div>
              </div>
            </div>
          ) : selectedListId ? (
            <div className="max-w-4xl mx-auto">
              <input
                type="text"
                value={activeList?.name || ""}
                onChange={(e) => {
                  const newName = e.target.value;
                  if (selectedListId && user?.id) {
                    setLists(lists.map(l => l.id === selectedListId ? { ...l, name: newName } : l));
                    debouncedUpdate(user.id, selectedListId, newName, editor?.getJSON());
                  }
                }}
                className="w-full text-4xl font-black text-slate-900 focus:outline-none mb-8 placeholder:text-slate-200"
                placeholder={t("untitled")}
              />
              <EditorContent editor={editor} />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
              <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center text-slate-200">
                <ListChecks size={48} weight="duotone" />
              </div>
              <h2 className="text-xl font-black text-slate-800">{t("welcomeTitle")}</h2>
              <p className="text-sm font-bold text-slate-400 max-w-xs">
                {t("welcomeDescription")}
              </p>
              <button
                onClick={() => setShowAddListModal(true)}
                className="bg-teal-500 text-white px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-teal-500/20 active:scale-95 transition-all"
              >
                {t("newPage")}
              </button>
            </div>
          )}
        </div>

        {/* Floating Toolbar (Optional but cool) */}
        {editor && (
          <Tooltip.Provider delayDuration={200}>
            <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-white border border-slate-200 shadow-2xl rounded-2xl p-1.5 flex items-center gap-1 z-50">
              <Tooltip.Root>
                <Tooltip.Trigger asChild>
                  <button
                    onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                    className={`p-2 rounded-lg transition-colors ${editor.isActive('heading', { level: 1 }) ? 'bg-slate-100 text-teal-600' : 'text-slate-400 hover:bg-slate-50'}`}
                  >
                    <TextHOne size={18} weight="bold" />
                  </button>
                </Tooltip.Trigger>
                <Tooltip.Portal>
                  <Tooltip.Content className="bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg shadow-xl z-[100] animate-in fade-in zoom-in duration-200" sideOffset={5}>
                    {t("toolbar.h1")}
                    <Tooltip.Arrow className="fill-slate-900" />
                  </Tooltip.Content>
                </Tooltip.Portal>
              </Tooltip.Root>

              <Tooltip.Root>
                <Tooltip.Trigger asChild>
                  <button
                    onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                    className={`p-2 rounded-lg transition-colors ${editor.isActive('heading', { level: 2 }) ? 'bg-slate-100 text-teal-600' : 'text-slate-400 hover:bg-slate-50'}`}
                  >
                    <TextHTwo size={18} weight="bold" />
                  </button>
                </Tooltip.Trigger>
                <Tooltip.Portal>
                  <Tooltip.Content className="bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg shadow-xl z-[100] animate-in fade-in zoom-in duration-200" sideOffset={5}>
                    {t("toolbar.h2")}
                    <Tooltip.Arrow className="fill-slate-900" />
                  </Tooltip.Content>
                </Tooltip.Portal>
              </Tooltip.Root>

              <Tooltip.Root>
                <Tooltip.Trigger asChild>
                  <button
                    onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                    className={`p-2 rounded-lg transition-colors ${editor.isActive('heading', { level: 3 }) ? 'bg-slate-100 text-teal-600' : 'text-slate-400 hover:bg-slate-50'}`}
                  >
                    <TextHThree size={18} weight="bold" />
                  </button>
                </Tooltip.Trigger>
                <Tooltip.Portal>
                  <Tooltip.Content className="bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg shadow-xl z-[100] animate-in fade-in zoom-in duration-200" sideOffset={5}>
                    {t("toolbar.h3")}
                    <Tooltip.Arrow className="fill-slate-900" />
                  </Tooltip.Content>
                </Tooltip.Portal>
              </Tooltip.Root>

              <Tooltip.Root>
                <Tooltip.Trigger asChild>
                  <button
                    onClick={() => editor.chain().focus().toggleBulletList().run()}
                    className={`p-2 rounded-lg transition-colors ${editor.isActive('bulletList') ? 'bg-slate-100 text-teal-600' : 'text-slate-400 hover:bg-slate-50'}`}
                  >
                    <ListBullets size={18} weight="bold" />
                  </button>
                </Tooltip.Trigger>
                <Tooltip.Portal>
                  <Tooltip.Content className="bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg shadow-xl z-[100] animate-in fade-in zoom-in duration-200" sideOffset={5}>
                    {t("toolbar.list")}
                    <Tooltip.Arrow className="fill-slate-900" />
                  </Tooltip.Content>
                </Tooltip.Portal>
              </Tooltip.Root>

              <Tooltip.Root>
                <Tooltip.Trigger asChild>
                  <button
                    onClick={() => editor.chain().focus().toggleTaskList().run()}
                    className={`p-2 rounded-lg transition-colors ${editor.isActive('taskList') ? 'bg-slate-100 text-teal-600' : 'text-slate-400 hover:bg-slate-50'}`}
                  >
                    <CheckCircle size={18} weight="bold" />
                  </button>
                </Tooltip.Trigger>
                <Tooltip.Portal>
                  <Tooltip.Content className="bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg shadow-xl z-[100] animate-in fade-in zoom-in duration-200" sideOffset={5}>
                    {t("toolbar.task")}
                    <Tooltip.Arrow className="fill-slate-900" />
                  </Tooltip.Content>
                </Tooltip.Portal>
              </Tooltip.Root>

              <div className="w-px h-6 bg-slate-200 mx-1" />
              
              <Tooltip.Root>
                <Tooltip.Trigger asChild>
                  <button className="p-2 rounded-lg text-slate-400 hover:bg-slate-50">
                    <Sparkle size={18} weight="fill" className="text-violet-500" />
                  </button>
                </Tooltip.Trigger>
                <Tooltip.Portal>
                  <Tooltip.Content className="bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg shadow-xl z-[100] animate-in fade-in zoom-in duration-200" sideOffset={5}>
                    {t("toolbar.ai")}
                    <Tooltip.Arrow className="fill-slate-900" />
                  </Tooltip.Content>
                </Tooltip.Portal>
              </Tooltip.Root>
            </div>
          </Tooltip.Provider>
        )}
      </main>

      {/* Add List Modal */}
      <AnimatePresence>
        {showAddListModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddListModal(false)}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100]"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-sm bg-white rounded-3xl shadow-2xl z-[101] p-8"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">{t("newPage")}</h3>
                <button onClick={() => setShowAddListModal(false)} className="text-slate-300 hover:text-slate-500">
                  <X size={20} weight="bold" />
                </button>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">{t("pageName")}</label>
                  <input
                    type="text"
                    autoFocus
                    value={newListName}
                    onChange={(e) => setNewListName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleCreateList()}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-sm font-bold focus:outline-none focus:border-teal-500"
                    placeholder={t("pageNamePlaceholder")}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">{t("color")}</label>
                  <div className="flex gap-2 flex-wrap">
                    {["#6366F1", "#10B981", "#F59E0B", "#EF4444", "#EC4899", "#8B5CF6", "#06B6D4"].map(c => (
                      <button
                        key={c}
                        onClick={() => setNewListColor(c)}
                        className={`w-8 h-8 rounded-full transition-all ${newListColor === c ? "ring-4 ring-slate-100 scale-110 shadow-sm" : "opacity-60 hover:opacity-100"}`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>

                <button
                  onClick={handleCreateList}
                  disabled={!newListName.trim()}
                  className="w-full bg-slate-900 text-white font-black py-4 rounded-2xl shadow-lg shadow-slate-900/20 transition-all active:scale-95 disabled:opacity-50 uppercase tracking-widest text-[11px]"
                >
                  {t("createPage")}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <style dangerouslySetInnerHTML={{ __html: `
        .ProseMirror p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left;
          color: #adb5bd;
          pointer-events: none;
          height: 0;
        }
        .ProseMirror {
          padding-bottom: 200px;
          outline: none !important;
        }
        .ProseMirror h1 {
          display: block;
          font-size: 2.5rem !important;
          font-weight: 900 !important;
          line-height: 1.2;
          margin: 0 !important;
          letter-spacing: -0.025em;
          color: #0f172a;
        }
        .ProseMirror h2 {
          display: block;
          font-size: 1.875rem !important;
          font-weight: 800 !important;
          line-height: 1.3;
          margin: 0 !important;
          letter-spacing: -0.025em;
          color: #0f172a;
        }
        .ProseMirror h3 {
          display: block;
          font-size: 1.5rem !important;
          font-weight: 700 !important;
          line-height: 1.4;
          margin: 0 !important;
          color: #0f172a;
        }
        .ProseMirror-selectednode {
          opacity: 0.3 !important;
          background: rgba(0,0,0,0.05) !important;
          border-radius: 8px !important;
          transition: opacity 0.2s !important;
        }
        .ProseMirror p {
          margin: 0 !important;
          line-height: 1.6;
        }
        .ProseMirror blockquote {
          border-left: 4px solid #e2e8f0;
          padding-left: 1rem;
          font-style: italic;
          color: #64748b;
          margin: 1.5rem 0;
        }
        .ProseMirror ul, .ProseMirror ol {
          padding-left: 1.5rem;
          margin-bottom: 1rem;
        }
        .ProseMirror ul {
          list-style-type: disc;
        }
        .ProseMirror ol {
          list-style-type: decimal;
        }
        .ProseMirror li {
          margin-bottom: 0.25rem;
        }
        .ProseMirror ul[data-type="taskList"] {
          list-style: none;
          padding: 0;
          margin: 0;
        }
      ` }} />
    </div>
  );
}
