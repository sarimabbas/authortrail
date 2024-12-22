import React from "react";
import {
  Document,
  TypeScript,
  Reactjs as JavaScript,
  Document as JsonIcon,
  Markdown,
  Image,
  Document as CssIcon,
  Document as HtmlIcon,
  Vue,
  Svelte,
  Python,
  Ruby,
  Go,
  Rust,
  Java,
  PHP,
  Swift,
  Kotlin,
  Docker,
  Git,
  NPM,
  Yaml,
  XML,
  PDF,
  Font,
  Audio,
  Video,
  Shell,
  Folder,
} from "@react-symbols/icons";
import { FC, SVGProps } from "react";

const ICON_SIZE = 16;

// Use SVGProps instead of our custom IconProps
type IconComponent = FC<SVGProps<SVGSVGElement>>;

export const getIconForFile = (filename: string): JSX.Element => {
  const ext = filename.split(".").pop()?.toLowerCase() || "";

  const iconProps = {
    width: ICON_SIZE,
    height: ICON_SIZE,
  };

  // Use IconComponent type for the map
  const iconMap: Record<string, IconComponent> = {
    // JavaScript & TypeScript
    ts: TypeScript,
    tsx: TypeScript,
    mts: TypeScript,
    js: JavaScript,
    jsx: JavaScript,

    // Data & Config
    json: JsonIcon,
    yaml: Yaml,
    yml: Yaml,
    xml: XML,

    // Web
    html: HtmlIcon,
    htm: HtmlIcon,
    css: CssIcon,
    scss: CssIcon,
    sass: CssIcon,
    less: CssIcon,

    // Documentation
    md: Markdown,
    mdx: Markdown,

    // Images
    png: Image,
    jpg: Image,
    jpeg: Image,
    gif: Image,
    svg: Image,
    webp: Image,

    // Frameworks
    vue: Vue,
    svelte: Svelte,

    // Programming Languages
    py: Python,
    rb: Ruby,
    go: Go,
    rs: Rust,
    java: Java,
    php: PHP,
    swift: Swift,
    kt: Kotlin,

    // Config & Build
    dockerfile: Docker,
    dockerignore: Docker,
    gitignore: Git,
    npmrc: NPM,
    nvmrc: NPM,

    // Media
    pdf: PDF,
    ttf: Font,
    otf: Font,
    woff: Font,
    woff2: Font,
    mp3: Audio,
    wav: Audio,
    mp4: Video,
    mov: Video,

    // Scripts
    sh: Shell,
    bash: Shell,
    zsh: Shell,
  };

  const Icon = iconMap[ext] || Document;
  return <Icon {...iconProps} />;
};

export const FolderIcon: FC = () => {
  return <Folder width={ICON_SIZE} height={ICON_SIZE} />;
};
