import { Logger, WARNINGLEVEL } from 'discord.ts-architecture';
import { Config, Lecture, Lecturer, Module, PrismaClient, Role } from '@prisma/client';

class SqlHandler {
  private prisma: PrismaClient;
  constructor() {
    this.prisma = new PrismaClient();
  }

  private async prismaQuery<T>(
    query: () => Promise<T>,
    error: (err: unknown) => void,
    defaultReturn?: T,
    forceDisconnect?: boolean
  ): Promise<T | null> {
    let returnValue: T | null = defaultReturn ?? null;
    try {
      returnValue = await query();
    } catch (err) {
      error(err);
    } finally {
      if (forceDisconnect) {
        await this.prisma.$disconnect();
      }
    }
    return returnValue;
  }

  public async setConfig(config: Config) {
    return await this.prismaQuery(
      async () => {
        const foundValue = await this.prisma.config.findUnique({
          where: {
            label: config.label
          }
        });
        if (foundValue) {
          await this.prisma.config.update({
            where: {
              label: config.label
            },
            data: {
              value: config.value
            }
          });
        } else {
          await this.prisma.config.create({
            data: config
          });
        }
      },
      (error) => {
        Logger.error('Error setting Config', error, config);
      }
    );
  }

  public async getConfig(label: string) {
    return await this.prismaQuery(
      async () => {
        return await this.prisma.config.findUnique({ where: { label: label } });
      },
      (error) => {
        Logger.exception('Error getting config', error, WARNINGLEVEL.ERROR, label);
      }
    );
  }

  public async setRole(role: Role) {
    return await this.prismaQuery(
      async () => {
        const found = await this.prisma.role.findUnique({
          where: {
            role_id: role.role_id
          }
        });
        if (found) {
          await this.prisma.role.update({
            where: {
              role_id: role.role_id
            },
            data: {
              uni_id: role.uni_id
            }
          });
        } else {
          await this.prisma.role.create({
            data: role
          });
        }
        return true;
      },
      (error) => {
        Logger.exception('Error setting role', error, WARNINGLEVEL.ERROR, role);
      },
      false
    );
  }

  public async getRole(role_id: string) {
    return await this.prismaQuery(
      async () => {
        return await this.prisma.role.findUnique({
          where: {
            role_id: role_id
          }
        });
      },
      (error) => {
        Logger.exception('Error retrieving role', error, WARNINGLEVEL.ERROR, role_id);
      }
    );
  }

  public async setModules(modules: (Module & { lectures: Lecture[]; lecturers: Lecturer[] })[]) {
    return await this.prismaQuery(
      async () => {
        const now = new Date().getTime();
        modules.forEach(async (module) => {
          // check if module exist
          const foundModule = await this.prisma.module.findUnique({
            where: {
              semester_uni_id: {
                semester: module.semester,
                uni_id: module.semester
              }
            }
          });
          // if module exists
          if (foundModule) {
            const disconnectAllModule = this.prisma.module.update({
              where: {
                id: foundModule.id
              },
              data: {
                lecturers: {
                  set: []
                },
                lectures: {
                  set: []
                }
              }
            });
            const connectOrCreateModule = this.prisma.module.update({
              where: {
                id: foundModule.id
              },
              data: {
                date: now,
                name: module.name,
                professor: module.professor,
                lectures: {
                  connectOrCreate: module.lectures.map((lecture: Lecture) => ({
                    where: {
                      module_id_type_time_day_group: {
                        module_id: foundModule.id,
                        type: lecture.type,
                        time: lecture.time ?? '',
                        day: lecture.day ?? '',
                        group: lecture.group ?? ''
                      }
                    },
                    create: {
                      type: lecture.type,
                      time: lecture.time,
                      day: lecture.time,
                      place: lecture.place,
                      group: lecture.group
                    }
                  }))
                },
                lecturers: {
                  connectOrCreate: module.lecturers.map((lecturer: Lecturer) => ({
                    where: {
                      module_id_name: {
                        module_id: foundModule.id,
                        name: lecturer.name
                      }
                    },
                    create: {
                      name: lecturer.name
                    }
                  }))
                }
              }
            });
            await this.prisma.$transaction([disconnectAllModule, connectOrCreateModule]);
          } else {
            await this.prisma.module.create({
              data: {
                semester: module.semester,
                uni_id: module.uni_id,
                date: now,
                name: module.name,
                professor: module.professor,
                lecturers: {
                  createMany: {
                    data: module.lecturers.map((lecturer: Lecturer) => ({
                      name: lecturer.name
                    }))
                  }
                },
                lectures: {
                  createMany: {
                    data: module.lectures.map((lecture: Lecture) => ({
                      type: lecture.type,
                      time: lecture.time,
                      day: lecture.day,
                      place: lecture.place,
                      group: lecture.group
                    }))
                  }
                }
              }
            });
          }
        });
        return true;
      },
      (error) => {
        Logger.exception('Error setting module', error, WARNINGLEVEL.ERROR);
      },
      false
    );
  }

  public async getSemesterDate(semester: string) {
    return await this.prismaQuery(
      async () => {
        const module = await this.prisma.module.findFirst({
          where: {
            semester: semester
          }
        });
        return module ? new Date(Number(module.date)) : null;
      },
      (error) => {
        Logger.exception('Error retrieving semester date', error, WARNINGLEVEL.ERROR);
      }
    );
  }

  public async getLectures(semester: string, uni_id: string) {
    return await this.prismaQuery(
      async () => {
        const module = await this.prisma.module.findUnique({
          where: {
            semester_uni_id: {
              semester: semester,
              uni_id: uni_id
            }
          },
          include: {
            lectures: true
          }
        });
        return module ? module.lectures : [];
      },
      (error) => {
        Logger.exception('Error retrieving lectures', error, WARNINGLEVEL.ERROR);
      }
    );
  }
  public async getLecturers(semester: string, uni_id: string) {
    return await this.prismaQuery(
      async () => {
        const module = await this.prisma.module.findUnique({
          where: {
            semester_uni_id: {
              semester: semester,
              uni_id: uni_id
            }
          },
          include: {
            lecturers: true
          }
        });
        return module ? module.lecturers.map((l) => l.name) : [];
      },
      (error) => {
        Logger.exception('Error retrieving lectures', error, WARNINGLEVEL.ERROR);
      }
    );
  }
  public async getModule(semester: string, uni_id: string) {
    return await this.prismaQuery(
      async () => {
        return await this.prisma.module.findUnique({
          where: {
            semester_uni_id: {
              semester: semester,
              uni_id: uni_id
            }
          },
          include: {
            lecturers: true,
            lectures: true
          }
        });
      },
      (error) => {
        Logger.exception('Error retrieving Module', error, WARNINGLEVEL.ERROR);
      }
    );
  }

  public async getModuleFromId(module_id: number) {
    return await this.prismaQuery(
      async () => {
        return await this.prisma.module.findUnique({
          where: {
            id: module_id
          },
          include: {
            lecturers: true,
            lectures: true
          }
        });
      },
      (error) => {
        Logger.exception('Error retrieving Module', error, WARNINGLEVEL.ERROR);
      }
    );
  }

  public async getMostRecentModule(uni_id: string) {
    return await this.prismaQuery(
      async () => {
        return await this.prisma.module.findFirst({
          where: {
            uni_id: uni_id
          },
          orderBy: {
            date: 'desc'
          },
          include: {
            lectures: true,
            lecturers: true
          }
        });
      },
      (error) => {
        Logger.exception('Error retrieving most recent module', error, WARNINGLEVEL.ERROR, uni_id);
      }
    );
  }

  public async getModuleIdFromChannel(channel: string) {
    return await this.prismaQuery(
      async () => {
        return (
          (
            await this.prisma.channel.findUnique({
              where: {
                channel_id: channel
              }
            })
          )?.uni_id ?? null
        );
      },
      () => {
        // Logger.exception('Error retrieving channel', error, WARNINGLEVEL.ERROR);
      }
    );
  }

  public async setChannel(channel: string, uni_id: string) {
    return await this.prismaQuery(
      async () => {
        const foundChannel = await this.prisma.channel.findUnique({
          where: {
            channel_id: channel
          }
        });
        if (foundChannel) {
          await this.prisma.channel.update({
            where: {
              channel_id: channel
            },
            data: {
              uni_id: uni_id
            }
          });
        } else {
          await this.prisma.channel.create({
            data: {
              channel_id: channel,
              uni_id: uni_id
            }
          });
        }
        return true;
      },
      (error) => {
        Logger.exception('Error setting channel', error, WARNINGLEVEL.ERROR, channel, uni_id);
      },
      false
    );
  }

  public async getModuleNameAndUniIds() {
    return await this.prismaQuery(
      async () => {
        return await this.prisma.module.findMany({
          select: {
            uni_id: true,
            name: true
          },
          distinct: ['uni_id', 'name']
        });
      },
      (error) => {
        Logger.exception('Error retrieving modules', error, WARNINGLEVEL.ERROR);
      }
    );
  }

  public async getSemesters() {
    return await this.prismaQuery(
      async () => {
        return (
          await this.prisma.module.findMany({
            select: {
              semester: true
            },
            distinct: ['semester']
          })
        )?.map((m) => m.semester);
      },
      (error) => {
        Logger.exception('Error retrieving semesters', error, WARNINGLEVEL.ERROR);
      }
    );
  }
}

const sqlClient = new SqlHandler();
export { sqlClient, SqlHandler };
