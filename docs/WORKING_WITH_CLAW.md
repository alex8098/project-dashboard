# 🤖 Working with Claw - Complete Guide

## Overview

**Claw** is your AI assistant running in OpenClaw. This guide covers everything you need to know to work effectively together.

---

## 🚀 Quick Start

### How to Communicate

Just **talk naturally**. No special commands needed.

**✅ Good examples:**
- "Search for the latest React best practices"
- "Create a file with a Python function to parse JSON"
- "Set a reminder for tomorrow at 9am"
- "Check my GitHub notifications"

**❌ Don't do:**
- "!search react" (no command prefixes needed)
- "CMD: create file" (just ask naturally)

---

## 🛠️ Core Capabilities

### 1. File Operations

**Create files:**
```
"Create a file called config.json with database settings"
```

**Read files:**
```
"Show me the contents of README.md"
```

**Edit files:**
```
"Add a new function to src/utils.js"
```

**Search files:**
```
"Find all files containing 'TODO'"
```

### 2. Web & Research

**Web search:**
```
"Search for Next.js 15 new features"
```

**Fetch pages:**
```
"Get the content from https://example.com/docs"
```

**Research:**
```
"Research the best practices for Docker security"
```

### 3. Code & Development

**Write code:**
```
"Write a React component for a login form"
```

**Debug:**
```
"This code has an error: [paste code]"
```

**Review:**
```
"Review this code for best practices"
```

**Generate tests:**
```
"Write unit tests for this function"
```

### 4. GitHub Integration

**Check repos:**
```
"List my GitHub repositories"
```

**Create issues:**
```
"Create a GitHub issue for bug X"
```

**Check PRs:**
```
"Show my open pull requests"
```

**Push code:**
```
"Push these files to GitHub"
```

### 5. Scheduling & Reminders

**Set reminders:**
```
"Remind me in 30 minutes to check email"
```

**Schedule tasks:**
```
"Every day at 9am, remind me to stand up"
```

**Cron jobs:**
```
"Create a weekly report every Monday"
```

### 6. Google Integration

**Calendar:**
```
"What's on my calendar today?"
```

**Create events:**
```
"Create a meeting tomorrow at 2pm"
```

**Tasks:**
```
"Add 'Buy milk' to my shopping list"
```

---

## 🎨 Best Practices

### 1. Be Specific

**❌ Vague:**
> "Fix the code"

**✅ Specific:**
> "Fix the error in src/utils.js where it's trying to access undefined property 'length' on line 45"

### 2. Provide Context

**❌ No context:**
> "Create a function"

**✅ With context:**
> "Create a Python function to parse JSON files in a directory. It should return a list of all objects found."

### 3. Iterate

Don't expect perfection on first try. Refine:

1. "Create a landing page" → Gets basic page
2. "Add a hero section with gradient background" → Improves it
3. "Make it responsive for mobile" → Final polish

### 4. Use File Paths

When working with files, always specify paths:

```
"Read /home/node/.openclaw/workspace/README.md"
"Create src/components/Button.tsx"
"Edit package.json to add dependency"
```

---

## 🔧 Troubleshooting

### "I can't see my files"

Make sure you're in the right directory:
```
"Show me the current directory"
"List files in /home/node/.openclaw/workspace"
```

### "The code has errors"

Share the error message:
```
"I'm getting this error: [paste error]"
"Fix the TypeScript error in this code: [paste code]"
```

### "It's not working"

Be specific about what you expected vs what happened:
```
"I expected the function to return an array, but it's returning undefined"
```

---

## 📚 Advanced Features

### 1. Multi-Agent Workflows

Coordinate multiple agents:
```
"Spawn 3 agents:
1. Frontend agent to build UI
2. Backend agent to create API
3. QA agent to write tests"
```

### 2. Code Review Mode

```
"Review this PR: https://github.com/user/repo/pull/123"
"Check for security issues in this code"
```

### 3. Documentation Generation

```
"Generate API documentation from these files"
"Create a README for this project"
```

### 4. Testing

```
"Write integration tests for this feature"
"Generate test data for the database"
```

---

## 🎯 Quick Reference Card

| Task | Command Example |
|------|----------------|
| **Search web** | "Search for React hooks best practices" |
| **Create file** | "Create src/utils/helpers.ts with formatDate function" |
| **Read file** | "Show me README.md" |
| **Edit file** | "Add error handling to src/api/route.ts" |
| **Run command** | "Check git status" |
| **GitHub** | "List my repos" or "Create issue for bug X" |
| **Schedule** | "Remind me in 30 minutes" |
| **Calendar** | "What's on my calendar today?" |
| **Debug** | "This code has an error: [paste]" |

---

## 💡 Tips for Best Results

1. **Start simple** - Ask for basic version first, then refine
2. **Provide examples** - "Like this: [example]"
3. **Iterate** - Don't expect perfection on first try
4. **Be specific** - Exact file paths, exact requirements
5. **Ask questions** - "What would you recommend?"

---

**Ready to build amazing things together! 🚀**