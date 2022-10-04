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
      },
      print: {
        description: 'Postet die Modulinformationen',
        error: {
          title: 'Fehler',
          not_set: 'Es konnte kein Modul für diesen Channel gefunden werden'
        },
        buttons: {
          set_channel: 'Modul setzen'
        },
        success: {
          lecture: 'Zeit: $0\nTag: $1\nRaum: $2',
          date: 'Abgerufen am: $0',
          main_title: 'Modulinfos',
          main: 'ID: $0\nProfessor: $1',
          lecturers: 'Dozenten'
        }
      },
      setModule: {
        options: {
          semester: 'Ausgewählte Semester',
          uni_id: 'Die Modul-ID'
        },
        description: 'Setzt das Modul für diesen Channel',
        error: {
          title: 'Error',
          description: 'Das Modul $1 vom Semester $0 existiert nicht.',
          internal: 'Ein interner Fehler ist aufgetreten beim setzen des Moduls.'
        },
        buttons: {
          retry: 'Erneut versuchen'
        },
        success: {
          title: 'Erfolgreich gesetzt',
          description: 'Das Module $1 aus dem Semester $0 wurde erfolgreich mit diesem Kanal verbunden.'
        }
      },
      linkrole: {
        description: 'Verbindet Rollen mit Modulen',
        options: {
          role: 'Die verbundene Rolle',
          module: 'Die ID des Moduls'
        },
        success: {
          title: 'Rolle verbunden',
          description: 'Erfolgreich die Rolle <@&$0> mit dem Modul `$1` verbunden'
        }
      },
      calendar: {
        description: 'Postet einen Kalender-Button',
        success: {
          title: 'Stundenplan Erstellung',
          description:
            'Erstelle deinen eigenen persönlichen Stundenplan.\nEinfach Kurse auswählen und auf den Button klicken.'
        },
        buttons: {
          calendar: 'Stundenplan Erstellen'
        }
      },
      setconfig: {
        description: 'Setzt Konfigurationswerte',
        options: {
          label: 'Das Werte-Label',
          value: 'Der Wert'
        },
        success: {
          title: 'Konfiguration angepasst',
          description: 'Die Konfiguration `$0` wurde auf `$1` gesetzt'
        }
      }
    },
    buttons: {
      setModule: {
        title: 'Modul setzen',
        description: 'Setz das Modul für diesen Channel',
        semester_placeholder: 'Semester',
        module_placeholder: 'Modul',
        set_module: 'Setzen'
      },
      setModuleTwo: {
        error: {
          not_set: 'Einige Infos sind nicht gesetzt',
          title: 'Error'
        },
        success: {
          title: 'Modul gesetzt',
          description: 'Channel erfolgreich mit Module $1 vom Semester $0 verbunden.'
        }
      },
      calendar: {
        success: {
          title: 'Stundenplan erstellt',
          description: 'Dein Stundenplan wurde erstellt und ist im Anhang.'
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
