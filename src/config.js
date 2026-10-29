// ---------------------------------------------------------------------
// SITE / REPO CONFIG
// These must match your actual GitHub username and repo name exactly —
// the Designer uses them to know where to save your card data.
// ---------------------------------------------------------------------
export const GITHUB_OWNER = 'ShaneIMPI'
export const GITHUB_REPO = 'impi-digital-cards'
export const GITHUB_BRANCH = 'main'

// ---------------------------------------------------------------------
// PASSCODE LOGIN
// This holds your GitHub access token in ENCRYPTED form — safe to be
// public, since it can only be unlocked with your passcode (which is
// never stored anywhere). Generate this value using the standalone
// passcode-setup.html tool (see SETUP.md) — never paste a real, unencrypted
// token here directly.
// ---------------------------------------------------------------------
export const ENCRYPTED_GITHUB_TOKEN = 'MSrOmr8tTmZ3kCmFAkdNrQP42uk9H9mq4wbV3r0o2al+XqC4RfptSCzdS9sKOyI5/kfoUsoCrWAl6NEgPYFeVJNVwDvtlA9PBPGR23+RGV+rl58Fsv5/nQDXVepSnnXwsD/3e4IrLp2tQx7wXcSNAeSSGzI3S2xAsxc36EJSTNRSpz8UUj2jL5U='
// ---------------------------------------------------------------------
// COMPANY-WIDE DEFAULTS
// Edit this file directly in GitHub (web editor or github.dev) to set
// your default logo and brand colours. Individual cards can still
// override these in the Designer if needed.
// ---------------------------------------------------------------------

// Paste the public URL of your IMPI logo here once you've uploaded it
// (e.g. via the "Logo" field on any card, or a full external URL).
// Leave blank to show a plain "IMPI" text mark instead.
export const DEFAULT_LOGO_URL = ''

export const COMPANY_NAME = 'IMPI RMS (Pty) Ltd'
export const COMPANY_WEBSITE = 'www.impi-secure.co.za'
export const COMPANY_PHONE = '012 543 0640'

export const BRAND = {
  accent: '#B8942E', // corporate gold (matches your reference card)
  dark: '#231F20', // IMPI dark
  red: '#DE1819' // IMPI red (available as an alternate accent)
}
