module.exports = {
    name: 'Server Ban Remove [Event]',

    description:
        'When an user is unbanned from a server, this event will trigger.',

    category: 'Events',

    auto_execute: true,

    inputs: [],

    options: [
        {
            id: 'unstable_outputs',
            name: 'Unstable Outputs',
            description:
                'Description: Process unstable outputs. It is not recommended due to low performance and accuracy, as values are not provided directly by the Discord API, using the server Audit Log instead.',
            type: 'SELECT',
            options: {
                no: 'No',
                yes: 'Yes (Not Recommended)'
            }
        }
    ],

    outputs: [
        {
            id: 'action',
            name: 'Action',
            description:
                'Type: Action\n\nDescription: Executes the following blocks when this block finishes its task.',
            types: ['action']
        },
        {
            id: 'server',
            name: 'Server',
            description:
                'Type: Object\n\nDescription: The server that the unban occurred in.',
            types: ['object']
        },
        {
            id: 'user',
            name: 'User',
            description:
                'Type: Object\n\nDescription: The user who was unbanned.',
            types: ['object']
        },
        {
            id: 'original_reason',
            name: 'Original Reason',
            description:
                'Type: Text\n\nDescription: The original reason for banning the user if any.',
            types: ['text']
        },
        {
            id: 'punisher',
            name: 'Punisher (User) (UNSTABLE)',
            description:
                'Type: Object, Undefined\n\nDescription: The user who unbanned the user. (This can be UNSTABLE and INACCURATE and can return an undefined value)',
            types: ['object', 'undefined']
        },
        {
            id: 'reason',
            name: 'Reason (UNSTABLE)',
            description:
                'Type: Text\n\nDescription: The reason for unbanning the user if any. (This can be UNSTABLE and INACCURATE)',
            types: ['text']
        }
    ],

    code(cache) {
        const unstable_outputs =
            this.GetOptionValue('unstable_outputs', cache) + ''

        const {PermissionFlagsBits, AuditLogEvent} = require('discord.js')

        this.events.on('guildBanRemove', async ({server, user, reason}) => {
            this.StoreOutputValue(server, 'server', cache)
            this.StoreOutputValue(user, 'user', cache)
            this.StoreOutputValue(reason, 'original_reason', cache)

            if (unstable_outputs == 'yes') {
                const me = await server.members.fetchMe()

                if (
                    me &&
                    me.permissions.has(PermissionFlagsBits.ViewAuditLog)
                ) {
                    const current = Date.now() - 10000

                    const entry = await server
                        .fetchAuditLogs({ type: AuditLogEvent.MemberBanRemove, limit: 5 })
                        .then((audit) =>
                            audit.entries.find(
                                (a) =>
                                    a.target.id == user.id &&
                                    a.createdTimestamp >= current
                            )
                        )
                    
                    if (entry) {
                        const executor = entry.executor
                        if (executor)
                            this.StoreOutputValue(executor, 'punisher', cache)

                        this.StoreOutputValue(entry.reason || '', 'reason', cache)
                    }
                }
            }

            this.RunNextBlock('action', cache)
        })
    }
}
