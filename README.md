# TraceRT

A cross-platform desktop application for running network traceroute diagnostics, built with Tauri v2, Rust, and React.

## Features

- **Cross-platform**: Works on Windows, macOS, and Linux
- **Native performance**: Rust backend with React frontend
- **Input validation**: Strict validation to prevent command injection
- **Dual output**: Both parsed hop table and raw command output
- **Export functionality**: Copy to clipboard or save as text file
- **Real-time feedback**: Loading states and error handling

## How It Works

TraceRT executes the native OS traceroute utility:
- **Windows**: Uses `tracert -d <target>`
- **macOS/Linux**: Uses `traceroute <target>` (falls back to `tracepath` if traceroute unavailable)

The `-d` flag on Windows disables DNS resolution for faster results.

## Security

### Input Validation
All targets are strictly validated to prevent command injection:
- Allows only: letters, digits, dots, dashes, colons (IPv6), and underscores
- Rejects: spaces, shell metacharacters, and other special characters
- Enforces maximum length of 255 characters

### Process Execution
Uses Rust's `std::process::Command` with argument arrays (not shell invocation) for secure command execution.

## Installation

### Prerequisites

- **Node.js** (v16 or higher)
- **Rust** (latest stable)
- **Platform-specific tools**:
  - Windows: No additional tools required
  - macOS: Xcode command line tools (`xcode-select --install`)
  - Linux: Build essentials (`sudo apt-get install build-essential`)

### Setup

```bash
# Clone the repository
git clone <repository-url>
cd TraceRT

# Install frontend dependencies
npm install

# Run in development mode
npm run tauri dev
```

### Building for Production

```bash
# Build the application
npm run tauri build
```

This creates platform-specific bundles in the `src-tauri/target/release/bundle/` directory.

## Usage

1. Enter a domain name or IP address in the input field
2. Click "Run Trace" or press Enter
3. View results in two formats:
   - **Parsed Hops**: Table showing hop number, host/IP, and response times
   - **Raw Output**: Complete command output for detailed analysis
4. Use "Copy Output" to copy results to clipboard
5. Use "Export to .txt" to save results as a timestamped text file

## Technical Architecture

### Frontend (React + TypeScript)
- Built with Vite for fast development
- Uses Tailwind-inspired styling (manual CSS classes)
- Communicates with backend via Tauri's IPC system

### Backend (Rust)
- Tauri v2 framework for desktop application
- Single command: `run_traceroute(target: String) -> Result<String, String>`
- Cross-platform process execution
- Robust error handling and input validation

### File Structure
```
TraceRT/
├── src/                 # React frontend
│   ├── App.tsx         # Main application component
│   └── ...             # Other frontend files
├── src-tauri/          # Rust backend
│   ├── src/
│   │   └── lib.rs      # Tauri command implementation
│   ├── Cargo.toml      # Rust dependencies
│   └── tauri.conf.json # Tauri configuration
├── package.json        # Node.js dependencies
└── README.md           # This file
```

## OS Differences

Different operating systems use different traceroute utilities with varying output formats:

### Windows (`tracert`)
```
1    <1 ms    <1 ms    <1 ms  192.168.1.1
2     2 ms     1 ms     1 ms  10.0.0.1
```

### Unix/Linux (`traceroute`)
```
1  192.168.1.1  0.500 ms  0.400 ms  0.300 ms
2  10.0.0.1  1.200 ms  1.100 ms  1.300 ms
```

The application parses both formats automatically and displays them in a unified table format.

## Troubleshooting

### Common Issues

1. **Command not found**: Make sure traceroute/tracert is installed on your system
2. **Permission denied**: Some systems require administrator/root privileges for traceroute
3. **Invalid target**: Ensure the target contains only allowed characters

### Platform-Specific Notes

- **Windows**: May require running as Administrator for some networks
- **Linux**: May need to install traceroute: `sudo apt-get install traceroute`
- **macOS**: Built-in traceroute should work without additional installation

## Development

### Running Tests
```bash
# Frontend tests
npm test

# Rust tests (if added)
cd src-tauri
cargo test
```

### Contributing
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Acknowledgments

Built with:
- [Tauri](https://tauri.app/) - Build smaller, faster, and more secure desktop applications
- [React](https://reactjs.org/) - JavaScript library for building user interfaces
- [Rust](https://www.rust-lang.org/) - Systems programming language