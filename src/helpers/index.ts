import { GameInfo, InstallProgress } from 'src/types'
import { IpcRenderer, Remote } from 'electron'

import { TFunction } from 'react-i18next'

const { ipcRenderer, remote } = window.require('electron') as {
  ipcRenderer: IpcRenderer
  remote: Remote
}
const {
  BrowserWindow,
  dialog: { showMessageBox }
} = remote

const readFile = async (file: string) =>
  await ipcRenderer.invoke('readConfig', file)

const writeConfig = async (
  data: [appName: string, x: unknown]
): Promise<void> => await ipcRenderer.invoke('writeConfig', data)

const install = async (args: {
  appName: string
  path: string
}): Promise<void> => await ipcRenderer.invoke('install', args)

const repair = async (appName: string): Promise<void> =>
  await ipcRenderer.invoke('repair', appName)

const launch = (args: string): Promise<string> =>
  ipcRenderer.invoke('launch', args).then((res: string): string => res)

const updateGame = (appName: string): Promise<void> =>
  ipcRenderer.invoke('updateGame', appName)

const notify = ([title, message]: [title: string, message: string]): void =>
  ipcRenderer.send('Notify', [title, message])

const loginPage = (): void => ipcRenderer.send('openLoginPage')

const sidInfoPage = (): void => ipcRenderer.send('openSidInfoPage')

const handleKofi = (): void => ipcRenderer.send('openSupportPage')

const handleQuit = (): void => ipcRenderer.send('quit')

const importGame = async (args: {
  appName: string
  path: string
}): Promise<void> => await ipcRenderer.invoke('importGame', args)

const openAboutWindow = (): void => ipcRenderer.send('showAboutWindow')

const openDiscordLink = (): void => ipcRenderer.send('openDiscordLink')

let progress: string

const sendKill = (appName: string): void => ipcRenderer.send('kill', appName)

/**
 * Deprecated API to spawn a subprocess with a legendary command.
 *
 * @param args
 * @returns Return code. ('error' or 'done')
 * @deprecated Avoid using, old code will be migrated.
 */
const legendary = async (args: string): Promise<string> =>
  await ipcRenderer
    .invoke('legendary', args)
    .then(async (res: string) => {
      const isError = res.includes('ERROR')
      return isError ? 'error' : 'done'
    })
    .catch((err: string | null) => String(err))

const isLoggedIn = async (): Promise<void> =>
  await ipcRenderer.invoke('isLoggedIn')

const syncSaves = async (
  savesPath: string,
  appName: string,
  arg?: string
): Promise<string> => {
  const { user } = await ipcRenderer.invoke('getUserInfo')

  const path = savesPath.replace('~', `/home/${user}`)
  console.log(path)

  const response: string = await ipcRenderer.invoke('syncSaves', [
    arg,
    path,
    appName
  ])
  return response
}

const getLegendaryConfig = async (): Promise<{
  library: GameInfo[]
  user: string
}> => {
  const user: string = await readFile('user')
  const library: Array<GameInfo> = await readFile('library')

  if (!user) {
    return { library: [], user: '' }
  }

  return { library, user }
}

const specialCharactersRegex = /('\w)|(\\(\w|\d){5})|(\\"(\\.|[^"])*")|[^((0-9)|(a-z)|(A-Z)|\s)]/g // addeed regex for capturings "'s" + unicodes + remove subtitles in quotes
const cleanTitle = (title: string) =>
  title
    .replaceAll(specialCharactersRegex, '')
    .replaceAll(' ', '-')
    .toLowerCase()
    .split('--definitive')[0]

const getGameInfo = async (appName: string) : Promise<GameInfo> => {
  return await ipcRenderer.invoke('getGameInfo', appName)
}

const handleSavePath = async (game: string) => {
  const { cloud_save_enabled, save_folder } = await getGameInfo(game)

  return { cloud_save_enabled, save_folder }
}

const createNewWindow = (url: string) =>
  new BrowserWindow({ height: 700, width: 1200 }).loadURL(url)

const formatStoreUrl = (title: string, lang: string) => {
  const storeUrl = `https://www.epicgames.com/store/${lang}/product/`
  return `${storeUrl}${cleanTitle(title)}`
}

function getProgress(progress: InstallProgress): number {
  if (progress && progress.percent) {
    return Number(progress.percent.replace('%', ''))
  }
  return 0
}

async function fixSaveFolder(
  folder: string,
  prefix: string,
  isProton: boolean
) {
  const { user, epicId } = await ipcRenderer.invoke('getUserInfo')
  const username = isProton ? 'steamuser' : user
  let winePrefix = prefix.replaceAll("'", '')
  winePrefix = isProton ? `${winePrefix}/pfx` : winePrefix

  folder = folder.replace('{EpicID}', epicId)
  folder = folder.replace('{EpicId}', epicId)

  if (folder.includes('locallow')) {
    return folder.replace(
      '{appdata}/../locallow',
      `${winePrefix}/drive_c/users/${username}/AppData/LocalLow`
    )
  }

  if (folder.includes('LocalLow')) {
    return folder.replace(
      '{AppData}/../LocalLow',
      `${winePrefix}/drive_c/users/${username}/AppData/LocalLow`
    )
  }

  if (folder.includes('{UserSavedGames}')) {
    return folder.replace(
      '{UserSavedGames}',
      `${winePrefix}/drive_c/users/${username}/Saved Games`
    )
  }

  if (folder.includes('{usersavedgames}')) {
    return folder.replace(
      '{usersavedgames}',
      `${winePrefix}/drive_c/users/${username}/Saved Games`
    )
  }

  if (folder.includes('roaming')) {
    return folder.replace(
      '{appdata}/../roaming/',
      `${winePrefix}/drive_c/users/${username}/Application Data/`
    )
  }

  if (folder.includes('{appdata}/../Roaming/')) {
    return folder.replace(
      '{appdata}/../Roaming/',
      `${winePrefix}/drive_c/users/${username}/Application Data/`
    )
  }

  if (folder.includes('Roaming')) {
    return folder.replace(
      '{AppData}/../Roaming/',
      `${winePrefix}/drive_c/users/${username}/Application Data/`
    )
  }

  if (folder.includes('{AppData}')) {
    return folder.replace(
      '{AppData}',
      `${winePrefix}/drive_c/users/${username}/Local Settings/Application Data`
    )
  }

  if (folder.includes('{appdata}')) {
    return folder.replace(
      '{appdata}',
      `${winePrefix}/drive_c/users/${username}/Local Settings/Application Data`
    )
  }

  if (folder.includes('{userdir}')) {
    return folder.replace(
      '{userdir}',
      `${winePrefix}/drive_c/users/${username}/My Documents`
    )
  }

  if (folder.includes('{UserDir}')) {
    return folder.replace(
      '{UserDir}',
      `${winePrefix}/drive_c/users/${username}/My Documents`
    )
  }

  return folder
}

async function handleStopInstallation(
  appName: string,
  [path, folderName]: string[],
  t: TFunction<'gamepage'>
) {
  const { response } = await showMessageBox({
    buttons: [
      t('gamepage:box.stopInstall.keepInstalling'),
      t('box.yes'),
      t('box.no')
    ],
    message: t('gamepage:box.stopInstall.message'),
    title: t('gamepage:box.stopInstall.title')
  })
  if (response === 1) {
    return sendKill(appName)
  } else if (response === 2) {
    sendKill(appName)
    return ipcRenderer.send('removeFolder', [path, folderName])
  }
}

export {
  createNewWindow,
  fixSaveFolder,
  formatStoreUrl,
  getGameInfo,
  getLegendaryConfig,
  getProgress,
  handleKofi,
  handleQuit,
  handleSavePath,
  handleStopInstallation,
  importGame,
  install,
  isLoggedIn,
  launch,
  legendary,
  loginPage,
  notify,
  openAboutWindow,
  openDiscordLink,
  progress,
  repair,
  sendKill,
  sidInfoPage,
  syncSaves,
  updateGame,
  writeConfig
}
