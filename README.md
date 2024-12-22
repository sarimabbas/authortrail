# 🤖 AuthorTrail

AuthorTrail helps you explore your Git repository's history by author. Find and browse files you've contributed to, with quick access to view and edit them.

![AuthorTrail Screenshot](public/og-image.png)

## Features

- 🔍 Search files by author email
- 📁 Hierarchical file tree visualization
- 📝 Built-in code viewer with syntax highlighting
- 🔗 Quick open in your default editor
- 🎨 Dark mode support

## Prerequisites

You'll need to install Bun first:

**macOS, Linux, WSL:**

```bash
curl -fsSL https://bun.sh/install | bash
```

**Windows (requires Windows 10 version 1809 or later):**

```powershell
powershell -c "irm bun.sh/install.ps1|iex"
```

## Getting Started

1. Clone the repository:

```bash
git clone https://github.com/yourusername/authortrail.git
cd authortrail
```

2. Install dependencies:

```bash
bun install
```

3. Start the development server:

```bash
bun run dev
```

4. Start the backend server:

```bash
bun run server
```

## How to Use

1. Enter the path to your Git repository (e.g., `/path/to/your/repo`)
2. Input your Git email or click the user icon to auto-fetch from Git config
3. Click "Search Files" to find all files you've authored
4. Navigate the file tree to view your contributions
5. Use the "Open in Editor" button to edit files in your preferred IDE

## Tech Stack

- Vite + React
- TypeScript
- shadcn/ui components
- Tailwind CSS
- CodeMirror for code viewing
- Bun for both package management and server runtime

## Development

The project structure is organized as follows:

```
src/
  ├── components/     # React components
  ├── pages/         # Page components
  ├── server/        # Backend server code
  ├── types/         # TypeScript types
  └── utils/         # Utility functions
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
