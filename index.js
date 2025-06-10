require('dotenv').config();
const { Client, GatewayIntentBits, Partials, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, Events, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers],
  partials: [Partials.GuildMember],
});

// Cria/abre o banco de dados SQLite
const db = new sqlite3.Database(path.join(__dirname, 'registro.db'));
db.run(`CREATE TABLE IF NOT EXISTS registros (
  userId TEXT PRIMARY KEY,
  nome TEXT,
  id TEXT,
  telefone TEXT
)`);

// Quando o bot estiver pronto
client.once('ready', () => {
  console.log(`🤖 Bot online como ${client.user.tag}`);
});

// Comando para iniciar o registro
client.on(Events.InteractionCreate, async interaction => {
  if (!interaction.isChatInputCommand()) return;
  if (interaction.commandName === 'setupregistro') {
    const embed = new EmbedBuilder()
      .setTitle('Sistema de Registro')
      .setDescription('Clique no botão abaixo para se registrar.')
      .setColor(0x00ff00);

    const botao = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('abrir_modal')
        .setLabel('Registrar')
        .setStyle(ButtonStyle.Success)
    );

    await interaction.reply({ embeds: [embed], components: [botao] });
  }
});

// Quando o botão for clicado
client.on(Events.InteractionCreate, async interaction => {
  if (!interaction.isButton()) return;
  if (interaction.customId === 'abrir_modal') {
    const modal = new ModalBuilder()
      .setCustomId('formulario_registro')
      .setTitle('Registro');

    const nomeInput = new TextInputBuilder()
      .setCustomId('nome')
      .setLabel('NOME:')
      .setStyle(TextInputStyle.Short)
      .setRequired(true);

    const idInput = new TextInputBuilder()
      .setCustomId('id')
      .setLabel('ID:')
      .setStyle(TextInputStyle.Short)
      .setRequired(true);

    const telefoneInput = new TextInputBuilder()
      .setCustomId('telefone')
      .setLabel('TELEFONE (IN GAME):')
      .setStyle(TextInputStyle.Short)
      .setRequired(true);

    const row1 = new ActionRowBuilder().addComponents(nomeInput);
    const row2 = new ActionRowBuilder().addComponents(idInput);
    const row3 = new ActionRowBuilder().addComponents(telefoneInput);

    modal.addComponents(row1, row2, row3);

    await interaction.showModal(modal);
  }
});

// Quando o modal for enviado
client.on(Events.InteractionCreate, async interaction => {
  if (!interaction.isModalSubmit()) return;
  if (interaction.customId === 'formulario_registro') {
    const nome = interaction.fields.getTextInputValue('nome');
    const id = interaction.fields.getTextInputValue('id');
    const telefone = interaction.fields.getTextInputValue('telefone');
    const membro = interaction.member;

    // Salva no banco de dados
    db.run(`INSERT OR REPLACE INTO registros (userId, nome, id, telefone) VALUES (?, ?, ?, ?)`,
      [membro.id, nome, id, telefone]);

    // Troca o apelido do membro
    try {
      await membro.setNickname(`${nome} | ${id}`);
    } catch (err) {
      console.error('Erro ao mudar apelido:', err);
    }

    // Gerencia cargos
    const guild = interaction.guild;
    const cargoMembro = guild.roles.cache.find(r => r.name === '・Membro');
    const cargoRegistro = guild.roles.cache.find(r => r.name === '・Registro');

    try {
      if (cargoMembro) await membro.roles.add(cargoMembro);
      if (cargoRegistro) await membro.roles.remove(cargoRegistro);
    } catch (err) {
      console.error('Erro ao gerenciar cargos:', err);
    }

    // Envia log para o canal
    const canalLog = guild.channels.cache.find(c => c.name.includes('logs'));
    if (canalLog && canalLog.isTextBased()) {
      const embed = new EmbedBuilder()
        .setTitle('📥 Novo Registro')
        .addFields(
          { name: 'Nome', value: nome },
          { name: 'ID', value: id },
          { name: 'Telefone (In Game)', value: telefone },
          { name: 'Usuário', value: `<@${membro.id}>` }
        )
        .setColor(0x3498db)
        .setTimestamp();

      canalLog.send({ embeds: [embed] });
    }

    await interaction.reply({ content: '✅ Registro realizado com sucesso!', ephemeral: true });
  }
});

console.log("TOKEN:", process.env.TOKEN);
client.login(process.env.TOKEN);
