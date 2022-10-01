export default class LanguageHandler {
  public static language = {
    commands: {
      capture: {
        options: {
          semester: 'Auswahl des Semesters (URL)',
          force: 'Überschreibung vorherig geschriebener Daten'
        },
        description: 'Lädt neue Modul-Daten',
        error: {
          title: 'Error',
          already_existent: 'Die Auswahl "$0" existiert bereits.\nErstellt am: $1\nErsetzen: Auswahl überschreiben.',
          failed: 'Unerwarteter interner Fehler (vielleicht falsche Auswahl?)'
        },
        buttons: {
          force_reset: 'Ersetzen',
          force_default: 'Aktualisieren'
        },
        success: {
          start_title: 'Informationen sammeln...',
          start_description: 'Ich sammle nun Modulinformationen für die Auswahl "$0"',
          title: 'Informationen gesammelt',
          description: 'Erfolgreich alle Modulinformationen extrahiert.'
        }
      }
    },
    handlers: {
      command: {
        error: {
          generic_error: 'There was an Error executing the command `$0$1`.'
        },
        permissions: {
          error: 'Invalid permissions to use `$0$1`!'
        }
      }
    },
    messages: {},
    general: {
      error: 'Error',
      description: 'Description',
      example: 'Example',
      usage: 'Usage',
      reason: 'Reason',
      server: 'Server',
      user: 'User',
      message: 'Message',
      title: 'Title'
    },
    error: {
      user_not_found: 'User not found',
      invalid_permissions: 'Invalid permissions',
      invalid_usage: 'Invalid usage'
    }
  };

  /**
   * Replaces preset args with values in a string
   * @param input
   * @param args
   * @return the filled string
   */
  public static replaceArgs(input: string, args: string[]) {
    // console.log(input);
    // console.log(args);
    for (let i = 0; i < args.length; i++) {
      input = input.split('$' + i).join(args[i]);
    }
    return input;
  }
}
