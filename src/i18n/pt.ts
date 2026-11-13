export const pt = {
	nav: {
		dashboard: "Painel",
		login: "Entrar",
		signup: "Criar conta",
		logout: "Sair",
		language: "Idioma",
		home: "Página inicial do Stackr",
		darkMode: "Mudar para modo escuro",
		lightMode: "Mudar para modo claro",
		darkModeSwitch: "Modo escuro",
		profile: "Perfil",
		preferences: "Preferências",
		mainNavigation: "Navegação principal",
		otherLanguage: "English",
		switchLanguage: "Mudar a língua para inglês",
	},
	footer: {
		tagline: "Literacia financeira para todos.",
		disclaimer:
			"O Stackr é uma ferramenta educativa e não dá aconselhamento financeiro.",
	},
	notFound: {
		eyebrow: "Erro 404",
		title: "Esta página perdeu-se pelo caminho.",
		detail:
			"O endereço pode estar errado ou a página já não existe. Volta ao início e continua a aprender.",
		goHome: "Voltar ao início",
		imageAlt: "Ilustração de um 404 com montanhas e uma planta",
	},
	common: {
		email: "Email",
		password: "Palavra-passe",
		back: "Voltar",
		next: "Seguinte",
		comingSoon: "Em breve",
		cancel: "Cancelar",
	},
	logoutConfirm: {
		title: "Sair da conta?",
		message: "Vais precisar de entrar outra vez para continuar a aprender.",
		confirm: "Sair",
	},
	errors: {
		invalidCredentials: "Email ou palavra-passe incorretos.",
		apiUnreachable:
			"Não foi possível ligar à API. Confirma que o json-server está a correr (bun run api).",
		apiFailed: "O pedido à API falhou. Tenta outra vez.",
		emailTaken: "Já existe uma conta com este email.",
		accountNotCreated: "Não foi possível criar a conta.",
		onboardingNotSaved:
			"Não foi possível guardar o teu trilho. Tenta outra vez.",
		notSignedIn: "A tua sessão terminou. Entra outra vez.",
		passwordsDoNotMatch: "As palavras-passe não coincidem.",
		unknown: "Algo correu mal.",
	},
	levels: {
		beginner: "Iniciante",
		apprentice: "Aprendiz",
		saver: "Poupador",
		investor: "Investidor",
		stackrMaster: "Mestre Stackr",
	},
	progress: {
		label: "O teu progresso",
		level: "Nível {level}",
		remaining: "Faltam {xp} XP para {next}",
		maxLevel: "Chegaste ao nível máximo.",
	},
	stats: {
		xp: "XP total",
		xpDetail: "Pontos de literacia",
		stacks: "Stacks",
		stacksDetail: "Moeda para conteúdo extra",
		streak: "Dias seguidos",
		streakDetail: "Estuda todos os dias para ganhar bónus",
		lessons: "Aulas concluídas",
		lessonsDetail: "Com 80% ou mais no quiz",
	},
	tracks: {
		foundation: {
			name: "Fundação",
			tagline: "Para quem está a começar do zero.",
			description:
				"Vais aprender a fazer um orçamento com a regra 50/30/20 e a montar um fundo de emergência antes de pensar em investir.",
			reason:
				"Ainda há conceitos base por consolidar, por isso começamos pelo essencial, com aulas curtas e muitos exemplos.",
		},
		strategist: {
			name: "Estratega",
			tagline: "Para quem quer investir a longo prazo.",
			description:
				"Vais perceber juros compostos, ETFs, diversificação e o efeito da inflação e dos impostos no teu rendimento real.",
			reason:
				"Já dominas o básico e preferes decisões ponderadas, por isso vamos direto a um plano de investimento a longo prazo.",
		},
		arena: {
			name: "Arena",
			tagline: "Para quem gosta de risco e quer controlá-lo.",
			description:
				"Vais aprender a distinguir volatilidade de perda definitiva, a reconhecer burlas e a nunca investir mais do que podes perder.",
			reason:
				"Tens apetite pelo risco, por isso o teu foco vai ser geri-lo bem, com desafios rápidos e feedback imediato.",
		},
	},
	home: {
		eyebrow: "Literacia financeira, um passo de cada vez",
		title: "Aprende a tratar do teu dinheiro sem complicações.",
		subtitle:
			"Aulas de dois minutos, quizzes logo a seguir e casos reais. Ganhas XP, sobes de nível e juntas Stacks enquanto aprendes.",
		start: "Começar agora",
		login: "Já tenho conta",
		goToDashboard: "Ir para o painel",
		heroImageAlt:
			"Ilustração de duas pessoas a subir um gráfico de barras com moedas à volta",
		facts: {
			tracks: { value: "3", label: "trilhos à tua medida" },
			lesson: { value: "2 min", label: "por aula, no máximo" },
			pass: { value: "80%", label: "para passar ao nível seguinte" },
		},
		ruleImageAlt:
			"Ilustração de uma pessoa a olhar para um carrinho de compras e preços a subir",
		ctaImageAlt: "Ilustração de uma carteira verde cheia de notas",
		preview: {
			nextLesson: "Próxima aula",
			nextLessonTitle: "O teu fundo de emergência",
			nextLessonDetail: "2 min, quiz de 5 perguntas",
		},
		tracksTitle: "Três trilhos, um ponto de partida certo",
		tracksSubtitle:
			"Um onboarding de seis perguntas indica o trilho que faz sentido para ti.",
		howTitle: "Como funciona",
		howSubtitle:
			"Sessões de cinco a dez minutos, sempre com o próximo passo à vista.",
		steps: {
			lesson: {
				title: "Aula curta",
				detail:
					"Texto simples e exemplos do dia a dia, como o primeiro salário.",
			},
			quiz: {
				title: "Quiz de cinco perguntas",
				detail: "Correção imediata com uma explicação curta em cada resposta.",
			},
			reward: {
				title: "Recompensa",
				detail: "XP, Stacks e badges a cada passo que dás.",
			},
		},
		rule: {
			eyebrow: "A regra dos 80%",
			title: "Só avanças quando dominas a matéria.",
			detail:
				"Com 80% ou mais no quiz, a aula seguinte desbloqueia. Abaixo disso voltas à aula, com as partes que erraste em destaque, e tentas outra vez.",
		},
		ctaTitle: "Pronto para começar?",
		ctaSubtitle: "Demora menos de um minuto a descobrir o teu trilho.",
	},
	login: {
		title: "Entrar",
		subtitle: "Bom ver-te de volta. Continua onde paraste.",
		submit: "Entrar",
		pending: "A entrar...",
		noAccount: "Ainda não tens conta?",
		demo: "Conta de demonstração: joao{'@'}example.com / 123456",
		panelTitle: "A tua sequência está à tua espera.",
		panelImageAlt: "Ilustração de uma carteira verde cheia de notas",
		panelDetail:
			"Uma aula por dia chega para manter os dias seguidos e ganhar bónus de XP.",
	},
	signup: {
		title: "Criar conta",
		subtitle: "Demora menos de um minuto.",
		name: "Nome",
		confirmPassword: "Confirmar palavra-passe",
		submit: "Criar conta",
		pending: "A criar conta...",
		haveAccount: "Já tens conta?",
		panelTitle: "Começa com 50 XP.",
		panelImageAlt:
			"Ilustração de duas pessoas a subir um gráfico de barras com moedas à volta",
		panelDetail:
			"Depois do registo respondes a seis perguntas rápidas e descobres o trilho certo para ti.",
	},
	dashboard: {
		greeting: "Olá, {name}",
		subtitle: "Aqui está o teu progresso.",
		currentLevel: "Nível atual",
		statsTitle: "As tuas estatísticas",
	},
	profile: {
		title: "Perfil",
		subtitle: "A tua conta, o teu trilho e o teu progresso.",
		account: "Conta",
		name: "Nome",
		track: "O teu trilho",
		noTrack: "Ainda por definir",
		changeTrack: "Refazer o questionário",
		nextStep: "Próximo passo",
		nextStepTitle: "A tua primeira aula está a chegar",
		nextStepDetail: "Estamos a preparar as aulas do teu trilho.",
	},
	onboarding: {
		intro: {
			eyebrow: "Bem-vindo ao Stackr",
			title: "Vamos encontrar o teu ponto de partida.",
			subtitle:
				"Três perguntas sobre o que já sabes e três sobre a forma como lidas com o risco. Não há respostas erradas.",
			start: "Começar",
			questions: "6 perguntas",
			duration: "Menos de um minuto",
			reward: "+50 XP no fim",
		},
		progress: "Pergunta {current} de {total}",
		knowledge: "Conhecimento",
		risk: "Risco",
		seeResult: "Ver resultado",
		saving: "A guardar...",
		result: {
			eyebrow: "O teu trilho",
			why: "Porquê este trilho",
			whatYouLearn: "O que vais aprender",
			reward: "Recompensa",
			rewardDetail: "Por completares o onboarding",
			xp: "+{amount} XP",
			continue: "Ir para o meu painel",
			retake: "Refazer o questionário",
		},
		questions: {
			budgetRule: {
				prompt: "O que divide a regra 50/30/20?",
				options: {
					needsWantsSavings: "Necessidades, desejos e poupança",
					taxesRentFood: "Impostos, renda e alimentação",
					stocksBondsCash: "Ações, obrigações e dinheiro",
					notSure: "Não sei",
				},
			},
			inflation: {
				prompt:
					"As tuas poupanças rendem 1% ao ano e a inflação está nos 3%. O que acontece ao teu poder de compra?",
				options: {
					grows: "Aumenta",
					staysTheSame: "Fica igual",
					shrinks: "Diminui",
					notSure: "Não sei",
				},
			},
			etf: {
				prompt: "O que é um ETF?",
				options: {
					singleShare: "Uma ação de uma única empresa",
					basketFund:
						"Um fundo com muitos ativos, negociado em bolsa como uma ação",
					savingsAccount: "Uma conta poupança com juro fixo",
					notSure: "Não sei",
				},
			},
			marketDrop: {
				prompt: "O teu investimento cai 20% num mês. O que fazes?",
				options: {
					sellEverything: "Vendo tudo para não perder mais",
					wait: "Espero e não mexo em nada",
					buyMore: "Aproveito para comprar mais",
				},
			},
			betChoice: {
				prompt: "Qual destas opções escolhias?",
				options: {
					sureAmount: "Receber 100 € garantidos",
					coinFlip: "50% de hipótese de receber 250 €",
					longShot: "10% de hipótese de receber 2000 €",
				},
			},
			hotTip: {
				prompt:
					"Um amigo garante que uma nova criptomoeda vai valer dez vezes mais este mês. O que fazes?",
				options: {
					ignore: "Ignoro, parece bom demais para ser verdade",
					research: "Pesquiso primeiro e talvez invista pouco",
					buyNow: "Invisto já, antes que suba",
				},
			},
		},
	},
};

export type MessageSchema = typeof pt;
