export default class LanguageHandler {
  public static language = {
    commands: {
    },
    handlers: {
      command: {
        error: {
          generic_error: 'There was an Error executing the command `$0$1`.',
        },
        permissions: {
          error: 'Invalid permissions to use `$0$1`!'
        },
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