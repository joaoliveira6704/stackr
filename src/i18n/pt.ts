export const pt = {
	nav: {
		dashboard: "Painel",
		budget: "Orçamento",
		register: "Registo",
		simulator: "Simulador",
		login: "Entrar",
		signup: "Criar conta",
		logout: "Sair",
		language: "Idioma",
		home: "Página inicial do Stackr",
		darkMode: "Mudar para modo escuro",
		lightMode: "Mudar para modo claro",
		darkModeSwitch: "Modo escuro",
		profile: "Perfil",
		learn: "Aprender",
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
		cancel: "Cancelar",
		saving: "A guardar...",
		unsaved: "Tens alterações por guardar.",
	},
	logoutConfirm: {
		title: "Sair da conta?",
		message: "Vais precisar de entrar outra vez para continuar a aprender.",
		confirm: "Sair",
	},
	errors: {
		startDateMissing: "Indica a data em que começaste este investimento.",
		invalidShares:
			"Diz quantas ações compraste, com um número maior do que zero.",
		invalidInvestedAmount:
			"Diz quanto investiste, com um valor maior do que zero.",
		sharesMissing: "Indica primeiro quantas ações já tens neste investimento.",
		invalidStartDate: "A data de início não pode estar no futuro.",
		invalidDeposit: "O valor a adicionar tem de ser maior do que zero.",
		invalidStartingAmount: "Diz quanto já tens, com um valor de zero ou mais.",
		registerNameMissing: "Dá um nome a este registo.",
		registerEntryMissing: "Este registo já não existe.",
		tooManySavings: "Só podes ter até 10 poupanças.",
		invalidCredentials: "Email ou palavra-passe incorretos.",
		apiUnreachable:
			"Não foi possível ligar à API. Confirma que o json-server está a correr (bun run api).",
		apiFailed: "O pedido à API falhou. Tenta outra vez.",
		emailTaken: "Já existe uma conta com este email.",
		accountNotCreated: "Não foi possível criar a conta.",
		onboardingNotSaved:
			"Não foi possível guardar o teu trilho. Tenta outra vez.",
		notSignedIn: "A tua sessão terminou. Entra outra vez.",
		accountNotFound:
			"A tua conta já não existe. Entra com outra conta ou cria uma nova.",
		passwordsDoNotMatch: "As palavras-passe não coincidem.",
		contentNotFound: "Não encontrámos este conteúdo.",
		progressNotSaved:
			"Não foi possível guardar o teu progresso. Vamos tentar outra vez na próxima alteração.",
		invalidYears: "Escolhe um prazo entre 1 e 50 anos.",
		invalidInflation: "A inflação tem de ser um número acima de -100%.",
		invalidAmount:
			"Os valores investidos têm de ser números iguais ou acima de zero.",
		invalidReturn: "A rentabilidade tem de ser um número acima de -100%.",
		marketUnavailable:
			"Não conseguimos ir buscar dados ao mercado agora. Tenta outra vez daqui a pouco.",
		tickerNotFound: "Não encontrámos esse ticker.",
		portfolioNotLoaded: "Não foi possível carregar a tua carteira.",
		portfolioNotSaved:
			"Não foi possível guardar a tua carteira. Tenta outra vez.",
		tooManyHoldings: "A carteira já tem o máximo de investimentos.",
		notEnoughStacks:
			"Não tens Stacks suficientes. Passa mais aulas para ganhar Stacks.",
		holdingExists: "Esse investimento já está na tua carteira.",
		budgetNotLoaded: "Não foi possível carregar o teu orçamento.",
		budgetNotSaved:
			"Não foi possível guardar o teu orçamento. Tenta outra vez.",
		invalidSalary: "O salário tem de ser um número igual ou acima de zero.",
		invalidPlannedAmount:
			"O valor planeado de cada despesa tem de ser um número igual ou acima de zero.",
		invalidPaidAmount: "O valor pago não pode ser negativo.",
		tooManyCategories: "O orçamento já tem o máximo de despesas.",
		categoryMissing: "Escolhe a despesa a que este gasto pertence.",
		categoryNameMissing: "Dá um nome à despesa.",
		dueDateMissing: "Escolhe a data limite desta despesa.",
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
		nextStepTitle: "Continua o teu trilho",
		nextStepDetail: "As tuas aulas estão à tua espera.",
		goToLessons: "Ir para as aulas",
	},
	learn: {
		title: "Aprender",
		subtitle:
			"O teu trilho, módulo a módulo. Cada aula termina com um quiz de cinco perguntas.",
		module: "Módulo {number}",
		lessonsDone: "{done} de {total} aulas concluídas",
		lessonsShort: "{done}/{total} aulas",
		modulePrice: "{price} Stacks",
		minutes: "{minutes} min",
		status: {
			locked: "Bloqueada",
			available: "Disponível",
			review: "Para rever",
			done: "Concluída",
		},
		lockedHint: "Conclui a aula anterior para a desbloquear.",
		moduleLockedHint: "Desbloqueia o módulo para abrir esta aula.",
		loading: "A carregar as aulas...",
		retry: "Tentar outra vez",
		balance: "{amount} Stacks",
		balanceLabel: "O teu saldo",
		moduleDone: "Módulo concluído",
		moduleBonus: "Conclui o módulo e ganha +{xp} XP e +{stacks} Stacks.",
		unlock: {
			button: "Desbloquear por {price} Stacks",
			missing: "Faltam-te {amount} Stacks.",
			moduleTitle: "Desbloquear este módulo?",
			oneOffTitle: "Desbloquear esta aula?",
			message:
				'Vais gastar {price} Stacks em "{title}" e ficas com {left}. Os Stacks gastos não voltam.',
			confirm: "Desbloquear",
		},
		extras: {
			title: "Aulas extra",
			subtitle:
				"Temas do dia a dia, para todos os trilhos. Desbloqueia com Stacks e ganha um pouco mais do que pagaste ao passar.",
			reward: "+{amount} Stacks",
			open: "Abrir aula",
			empty: "Ainda não há aulas extra.",
		},
	},
	scroller: {
		previous: "Ver anteriores",
		next: "Ver mais",
	},
	lesson: {
		back: "Voltar às aulas",
		reviewTitle: "Vamos rever esta aula",
		reviewMessage:
			"As partes ligadas às perguntas que erraste estão em destaque. Lê-as com calma e tenta o quiz outra vez.",
		reviewTag: "Rever",
		example: "Exemplo",
		startQuiz: "Fazer o quiz",
		locked: "Esta aula ainda está bloqueada.",
		loading: "A carregar a aula...",
	},
	quiz: {
		progress: "Pergunta {current} de {total}",
		passMark: "Precisas de 80% para passar",
		check: "Verificar",
		next: "Seguinte",
		finish: "Ver resultado",
		correct: "Certo!",
		wrong: "Não é bem assim.",
		passTitle: "Aula concluída!",
		passMessage:
			"Acertaste {correct} de {total}. A aula seguinte já está desbloqueada.",
		failTitle: "Quase lá",
		failMessage:
			"Acertaste {correct} de {total}. Precisas de 80% para avançar. Revê as partes em destaque e tenta outra vez.",
		score: "Resultado",
		xpEarned: "+{amount} XP",
		stacksEarned: "+{amount} Stacks",
		alreadyDone:
			"Já tinhas concluído esta aula, por isso desta vez não há recompensa.",
		passMessageOneOff:
			"Acertaste {correct} de {total}. Recuperaste os Stacks que gastaste e ainda ganhaste mais.",
		moduleDoneTitle: "Módulo concluído!",
		moduleDoneMessage:
			"Terminaste todas as aulas deste módulo. Aqui tens o teu bónus.",
		review: "Rever a aula",
		nextLesson: "Próxima aula",
		backToLearn: "Voltar às aulas",
		loading: "A carregar o quiz...",
		readFirstTitle: "Primeiro, a aula",
		readFirstMessage:
			"O quiz só abre depois de leres a aula teórica até ao fim. Se falhares, voltas a ler antes de tentar outra vez.",
		goToLesson: "Ir para a aula",
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
		explanation: {
			title: "Explicação detalhada",
			showHint: "Para quando quiseres saber mais",
			hideHint: "Carrega de novo para esconder",
			reveal: "Ver explicação",
		},
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
				explanation:
					"A regra 50/30/20 é uma forma simples de dividir o que ganhas todos os meses. Cerca de 50% vai para as necessidades, como a renda, as contas e a comida. Até 30% fica para os desejos, como jantares fora ou subscrições. Pelo menos 20% vai para a poupança ou para pagar dívidas. Não é uma lei, é um ponto de partida que podes ajustar à tua vida.",
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
				explanation:
					"A inflação mede quanto os preços sobem ao longo do tempo. Se as tuas poupanças rendem 1% e os preços sobem 3%, o teu dinheiro cresce mais devagar do que o custo das coisas. Ao fim de um ano tens mais euros, mas compras menos com eles, por isso o teu poder de compra diminui. É por isso que vale a pena procurar formas de pôr o dinheiro a render acima da inflação.",
				options: {
					grows: "Aumenta",
					staysTheSame: "Fica igual",
					shrinks: "Diminui",
					notSure: "Não sei",
				},
			},
			etf: {
				prompt: "O que é um ETF?",
				explanation:
					"ETF quer dizer Exchange Traded Fund, um fundo negociado em bolsa. Junta dezenas ou centenas de ativos, como ações ou obrigações, num só produto que compras e vendes como uma ação normal. Com uma única compra espalhas o teu dinheiro por muitas empresas, por isso não dependes do sucesso de uma só. Muitos ETF seguem um índice inteiro e têm custos baixos.",
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
				explanation:
					"Quedas de 20% acontecem nos mercados mais vezes do que parece, e no passado acabaram por recuperar, embora nada o garanta. Quem vende em pânico transforma uma perda no papel numa perda real. Esperar mostra paciência, e comprar mais pode baixar o teu preço médio, mas só faz sentido com dinheiro de que não vais precisar tão cedo. Não há uma resposta certa, só a que combina contigo.",
				options: {
					sellEverything: "Vendo tudo para não perder mais",
					wait: "Espero e não mexo em nada",
					buyMore: "Aproveito para comprar mais",
				},
			},
			betChoice: {
				prompt: "Qual destas opções escolhias?",
				explanation:
					"Esta pergunta compara a certeza com o risco. Em média, os 100 € garantidos valem 100 €, a moeda ao ar vale 125 € e a aposta mais difícil vale 200 €. Mesmo assim, muita gente prefere o valor certo, porque perder custa mais do que ganhar sabe bem. Perceber como reages a esta escolha ajuda-te a saber quanto risco aguentas sem perder o sono.",
				options: {
					sureAmount: "Receber 100 € garantidos",
					coinFlip: "50% de hipótese de receber 250 €",
					longShot: "10% de hipótese de receber 2000 €",
				},
			},
			hotTip: {
				prompt:
					"Um amigo garante que uma nova criptomoeda vai valer dez vezes mais este mês. O que fazes?",
				explanation:
					"Promessas de ganhos enormes em pouco tempo são um dos sinais mais comuns de esquemas e de bolhas. As criptomoedas novas podem subir muito, mas também podem perder quase todo o valor de um dia para o outro. Antes de investir, pergunta quem ganha com a dica, pesquisa o projeto e nunca ponhas lá mais do que estás disposto a perder.",
				options: {
					ignore: "Ignoro, parece bom demais para ser verdade",
					research: "Pesquiso primeiro e talvez invista pouco",
					buyNow: "Invisto já, antes que suba",
				},
			},
		},
	},
	simulator: {
		eyebrow: "Simulador",
		title: "Projeta o teu investimento.",
		subtitle:
			"Parte da carteira que registaste, vê quanto pode valer no futuro e experimenta um novo investimento antes de começares.",
		save: "Guardar definições",
		saved: "Definições guardadas.",
		loading: "A carregar a tua carteira...",
		retry: "Tentar outra vez",
		settings: {
			title: "Inflação",
			subtitle:
				"Quanto achas que os preços vão subir por ano. O Banco Central Europeu aponta para 2%.",
			inflation: "Inflação por ano",
		},
		rates: {
			label: {
				tanb: "TANB por ano",
				tanl: "TANL por ano",
				tae: "TAE / APY por ano",
			},
			step: "Sobe por ano (pontos)",
			fixedYears: "Anos com a primeira taxa",
			later: "Taxa depois disso",
			variableHint:
				"Escreve a taxa média que esperas, porque ninguém sabe como o indexante vai mudar.",
			equivalents: "TANB {tanb} · TANL {tanl} · TAE {tae}",
		},
		portfolio: {
			title: "A tua carteira registada",
			subtitle:
				"Experimenta outro depósito mensal ou outra taxa. O valor e a taxa reais ficam no teu registo.",
			edit: "Editar registo",
			current: "Valor atual",
			monthlyDeposit: "Depósito mensal",
			investments: "Investimentos",
			savings: "Poupanças",
			emptyTitle: "Ainda não tens nada registado.",
			emptyDetail:
				"Adiciona os teus investimentos e poupanças no registo, ou experimenta abaixo um novo investimento.",
		},
		trial: {
			title: "Experimentar um novo investimento",
			subtitle:
				"Vê se cabe no teu orçamento e se compensa. Fica só nesta simulação e não entra no teu registo.",
			defaultName: "Novo investimento",
			verdictTitle: "Vale a pena?",
			verdictSubtitle:
				"O que muda na tua carteira daqui a {years} ano. | O que muda na tua carteira daqui a {years} anos.",
			extraValue: "Valor que acrescenta",
			extraValueDetail: "De {without} para {with}",
			fitsTitle: "Cabe no teu orçamento",
			fitsDetail: "Ainda sobram {amount} por mês",
			tooMuchTitle: "Não cabe no teu orçamento",
			tooMuchDetail: "Faltam {amount} por mês",
			unknownTitle: "Falta o teu orçamento",
			unknownDetail: "Preenche o salário para saberes se cabe",
			beatsInflationTitle: "Ganha à inflação",
			beatsInflationDetail: "{amount} em dinheiro de hoje, após impostos.",
			losesToInflationTitle: "Perde para a inflação",
			losesToInflationDetail:
				"Menos {amount} em dinheiro de hoje, após impostos.",
			abovePortfolio: "Rende mais do que a tua carteira.",
			belowPortfolio: "Rende menos do que a tua carteira.",
			confirmRemove: {
				title: "Remover {name} da simulação?",
				message: "Perdes os valores que escreveste nesta experiência.",
				confirm: "Remover da simulação",
			},
		},
		holdings: {
			title: "A tua carteira",
			subtitle:
				"Procura ações, ETF ou cripto pelo nome ou ticker, até {max} investimentos.",
			addManual: "Adicionar à mão",
			full: "Chegaste ao máximo de {max} investimentos.",
			emptyTitle: "Ainda não tens investimentos.",
			emptyDetail:
				"Procura um ticker acima, escolhe um dos populares ou adiciona um investimento à mão com a tua própria estimativa.",
		},
		search: {
			label: "Procurar investimento",
			placeholder: "Por exemplo VWCE, Apple ou Bitcoin",
			searching: "A procurar...",
			noResults: "Sem resultados para esta pesquisa.",
			popular: "Populares:",
			adding: "A ir buscar o histórico...",
			noHistoryNotice:
				"Não conseguimos ir buscar o histórico de {name}. Escreve a rentabilidade que esperas.",
		},
		kinds: {
			stock: "Ação",
			etf: "ETF",
			fund: "Fundo",
			crypto: "Cripto",
			index: "Índice",
			manual: "Adicionado à mão",
		},
		holding: {
			name: "Nome",
			initial: "Valor inicial",
			monthly: "Por mês",
			return: "Rentabilidade por ano",
			remove: "Remover {name}",
			fromHistory:
				"Média real do último ano | Média real dos últimos {years} anos",
			noHistory: "Sem histórico, escreve a tua estimativa",
			manual: "A tua estimativa",
			defaultName: "Investimento {number}",
			yearlyTitle: "Variação em cada ano",
			yearlyEntry: "{year}: {change}",
		},
		duration: {
			label: "Durante quanto tempo?",
			years: "{years} ano | {years} anos",
			slider: "Prazo do investimento, em anos",
		},
		confirmRemove: {
			title: "Remover {name}?",
			message:
				"Sai da tua carteira com os valores que escreveste. Para o voltares a ter, tens de o adicionar outra vez.",
			confirm: "Remover",
		},
		confirmLeave: {
			title: "Sair sem guardar?",
			message:
				"As alterações às definições da simulação perdem-se se saíres agora.",
			confirm: "Sair sem guardar",
		},
		results: {
			title: "Daqui a {years} ano | Daqui a {years} anos",
			invested: "Total investido",
			investedDetail: "{initial} no início e {monthly} por mês",
			value: "Valor final",
			valueDetail: "{rate} sobre o que investiste",
			gain: "Ganho",
			gainDetail: "{net} depois de impostos",
			realGain: "Acima da inflação",
			realGainUp: "Quanto o teu poder de compra cresce, em dinheiro de hoje",
			realGainDown: "Perdes poder de compra, a inflação ganha a este plano",
		},
		chart: {
			title: "Como o teu dinheiro cresce",
			subtitle: "Passa o rato ou usa as setas para ver cada ano.",
			label: "Gráfico do crescimento da carteira ao longo dos anos",
			hint: "Usa as setas para a esquerda e para a direita para ver cada ano.",
			value: "Valor da carteira",
			invested: "Total investido",
			realValue: "Em dinheiro de hoje",
			yearTick: "{year}a",
			yearLabel: "Ano {year}",
			year: "Ano",
			showTable: "Ver tabela",
			hideTable: "Esconder tabela",
		},
		allocation: {
			title: "Como está dividida",
			subtitle:
				"O peso de cada investimento no que pões ao fim de {years} ano. | O peso de cada investimento no que pões ao fim de {years} anos.",
			empty: "Escreve valores para ver como se divide a tua carteira.",
			others: "{count} outros",
		},
		reality: {
			title: "Inflação e impostos",
			subtitle: "O que sobra de verdade no fim.",
			realValue: "Em dinheiro de hoje",
			realValueDetail: "O que o valor final compraria hoje",
			inflationCost: "O que a inflação come",
			inflationCostDetail: "Diferença entre o valor final e o de hoje",
			tax: "Imposto sobre o ganho",
			taxDetail: "Taxa de {rate} em Portugal, ao vender",
			averageReturn: "Rentabilidade média",
			averageReturnDetail: "Da carteira toda, por ano",
		},
		scenarios: {
			title: "Cenários",
			subtitle: "Ninguém sabe o futuro, por isso vê o intervalo.",
			pessimistic: "Pessimista",
			expected: "Esperado",
			optimistic: "Otimista",
			expectedDetail: "Com as rentabilidades que escolheste",
			lowerDetail: "Com {points} pontos a menos por ano",
			higherDetail: "Com {points} pontos a mais por ano",
		},
		breakdown: {
			title: "Por investimento",
			subtitle:
				"Quanto vale cada um daqui a {years} ano. | Quanto vale cada um daqui a {years} anos.",
			detail: "Investes {invested}, ganhas {gain}",
		},
		disclaimer:
			"Isto é uma simulação educativa e não é aconselhamento financeiro. Rentabilidades passadas não garantem as futuras, e o histórico vem na moeda de cada ativo, sem contar com o câmbio.",
	},
	budget: {
		eyebrow: "Orçamento",
		title: "Organiza o teu mês.",
		subtitle:
			"Escreve o teu salário, junta as tuas despesas e marca o que já pagaste. Nós mostramos como fica o teu ano.",
		saved: "Orçamento guardado.",
		loading: "A carregar o teu orçamento...",
		retry: "Tentar outra vez",
		salary: {
			title: "O teu salário",
			subtitle: "O que recebes por mês, já depois de impostos.",
			label: "Salário líquido por mês",
			planned: "Planeado",
			unassigned: "Por atribuir",
			overAssigned: "Planeado a mais",
		},
		groups: {
			needs: "Necessidades",
			wants: "Desejos",
			savings: "Poupança",
		},
		categories: {
			title: "Gastos deste mês",
			subtitle:
				"Regista as tuas contas, atuais e futuras. O valor pago volta a zero depois de cada data limite. Até {max} despesas.",
			add: "Novo registo",
			full: "Chegaste ao máximo de {max} despesas.",
			emptyTitle: "Ainda não tens despesas.",
			total: "Total pago",
			totalDetail: "De {planned} planeados",
		},
		category: {
			name: "Nome",
			description: "Descrição (opcional)",
			group: "Tipo",
			planned: "Valor",
			recurrence: "Recorrência",
			recurrences: {
				once: "Uma vez",
				monthly: "Mensal",
				quarterly: "Trimestral",
				yearly: "Anual",
			},
			dueDate: "Data limite",
			dueDateOptional: "Data limite (opcional)",
			due: "Até {date}",
			overdue: "Em atraso desde {date}",
			summary: "{planned} · {recurrence}",
			edit: "Editar {name}",
			remove: "Remover {name}",
			paid: "Já pago",
			editPaid: "Editar o valor pago em {name}, agora {amount}",
			paidInput: "Valor pago em {name}",
			paidSlider: "Quanto já pagaste de {name}",
			status: {
				left: "Faltam {amount}",
				paidOff: "Liquidada",
				over: "Excedida em {amount}",
				unplanned: "Sem valor planeado",
			},
		},
		categoryDialog: {
			addTitle: "Novo registo",
			editTitle: "Editar despesa",
			subtitle:
				"Diz o que é, quanto custa, de quanto em quanto tempo se paga e até quando.",
			addSubmit: "Registar",
			editSubmit: "Guardar alterações",
		},
		flow: {
			title: "Para onde vai o teu dinheiro",
			subtitle: {
				month: "O caminho do salário deste mês até cada conta e poupança.",
				year: "O caminho do salário deste ano até cada conta e poupança.",
			},
			periodLabel: "Ver o fluxo por período",
			periods: { month: "Mês", year: "Ano" },
			label: "Gráfico do fluxo do dinheiro do salário até cada destino",
			hint: "Usa as setas para percorrer cada fluxo.",
			salary: "Salário",
			shortfall: "Em falta",
			others: "{count} outros",
			link: "{from} para {to}: {amount}",
			from: "De",
			to: "Para",
			amount: "Valor",
			empty: "Escreve o teu salário ou adiciona despesas para veres o fluxo.",
			openRegister: "Abrir registo",
			registeredTitle: {
				month: "Adicionado ao registo este mês",
				year: "Adicionado ao registo este ano",
			},
			registeredDetail: "{value} registados no total",
		},
		rule: {
			title: "Regra 50/30/20",
			subtitle:
				"Metade para necessidades, 30% para desejos e pelo menos 20% para poupar.",
			noSalary: "Escreve o teu salário para comparar o teu plano com a regra.",
			targetMax: "Ideal até {target}",
			targetMin: "Ideal de pelo menos {target}",
			onTrack: "Dentro da regra",
			above: "Acima do ideal",
			below: "Abaixo do ideal",
			savingsNote:
				"A poupança conta as compras e os depósitos que fizeste este mês nos teus cards. O valor inicial e o dinheiro por atribuir não entram.",
		},
		year: {
			title: "O teu ano",
			subtitle: "O custo real das tuas contas ao longo do ano.",
			income: "Rendimento anual",
			incomeDetail: "{monthly} por mês",
			spending: "Gastos anuais",
			spendingDetail: "Necessidades e desejos",
			saving: "Poupança anual",
			savingDetail: "Registado este ano até {date}",
		},
		confirmRemoveCategory: {
			title: "Remover {name}?",
			message:
				"A despesa sai do teu orçamento. | A despesa sai do teu orçamento, com o gasto registado nela. | A despesa sai do teu orçamento, com os {count} gastos registados nela.",
			confirm: "Remover despesa",
		},
		confirmLeave: {
			title: "Sair sem guardar?",
			message: "As alterações ao teu orçamento perdem-se se saíres agora.",
			confirm: "Sair sem guardar",
		},
	},
	register: {
		eyebrow: "Registo",
		title: "Regista o teu dinheiro.",
		subtitle:
			"Guarda aqui o que já tens em investimentos e poupanças e junta cada valor novo. As simulações ficam no simulador.",
		saved: "Registo guardado.",
		loading: "A carregar o teu registo...",
		retry: "Tentar outra vez",
		noHistoryNotice:
			"Não conseguimos ir buscar o histórico de {name}. Define a rentabilidade no simulador.",
		totals: {
			value: "Valor registado",
			valueDetail: "Investimentos e poupanças de hoje",
			monthly: "Adicionado este mês",
			monthlyDetail:
				"Compras e depósitos nos cards, o valor que entra no orçamento",
		},
		investments: {
			title: "Os teus investimentos",
			subtitle:
				"Procura ações, ETF ou cripto pelo nome ou ticker, até {max} investimentos.",
			emptyDetail:
				"Procura um ticker acima, escolhe um dos populares ou adiciona um investimento à mão.",
		},
		entry: {
			current: "Valor atual",
			addLabel: "Valor investido",
			sharesLabel: "Ações compradas",
			since: "Desde {date}",
			missingInvestmentDate: "Define a data de início",
			position: "{invested} investidos · {shares} ações",
			investedOnly: "{invested} investidos",
			priceNote: "Valor estimado · preço de {date}",
			noPrice: "Sem preço de mercado, a mostrar o valor investido",
			missingShares: "Indica quantas ações tens para seguir o valor",
			breakdown: "{deposited} depositados + {interest} de juros",
			missingStartDate: "Define a data de início para contar juros",
			add: "Adicionar a {name}",
			edit: "Editar {name}",
			remove: "Remover {name}",
		},
		icons: {
			growth: "Crescimento",
			savings: "Mealheiro",
			home: "Casa",
			car: "Carro",
			travel: "Viagem",
			studies: "Estudos",
			family: "Família",
			gift: "Presente",
			retirement: "Reforma",
			shield: "Segurança",
		},
		edit: {
			title: "Editar {name}",
			subtitle:
				"Dá-lhe um nome teu e um ícone, e confirma as condições do juro.",
			nametag: "Nametag (opcional)",
			nametagHint: "Se a deixares vazia, volta a aparecer {name}.",
			icon: "Ícone",
			defaultIcon: "Ícone por defeito",
			invested: "Total investido",
			shares: "Ações que tens",
			manualValue: "Valor atual (opcional)",
			submit: "Guardar alterações",
		},
		dialog: {
			investmentTitle: "Novo investimento",
			savingsTitle: "Nova poupança",
			subtitle: "Diz quanto já tens. Depois só precisas de ir adicionando.",
			name: "Nome",
			amount: "Quanto já tens",
			amountOnDate: "Valor nessa data",
			investmentStart: "Data de início do investimento",
			tickerSubtitle:
				"Copia o valor e as ações da confirmação da tua corretora.",
			submit: "Registar",
		},
		savings: {
			title: "As tuas poupanças",
			subtitle: "Escolhe o tipo de cada poupança, até {max} registos.",
			add: "Nova poupança",
			empty: "Ainda não tens poupanças registadas.",
			full: "Chegaste ao máximo de {max} poupanças.",
			type: "Tipo de poupança",
			interest: "Tipo de juro",
			startDate: "Data de início",
			startDateHint:
				"O valor registado conta como o que tinhas nesse dia. Os juros contam daí até hoje.",
			rateBasis: "Tipo de taxa",
			rateBases: {
				tanb: "TAN / TANB (bruta)",
				tanl: "TANL (líquida)",
				tae: "TAE / APY (efetiva)",
			},
			rateShort: { tanb: "TANB", tanl: "TANL", tae: "TAE / APY" },
			ratePath: "Evolução da taxa",
			ratePaths: {
				fixed: "Fixa",
				variable: "Variável ou indexada",
				stepped: "Crescente",
				mixed: "Mista",
			},
			interestKinds: {
				simple: "Juro simples",
				compoundMonthly: "Composto mensal",
				compoundQuarterly: "Composto trimestral",
				compoundSemiannual: "Composto semestral",
				compoundYearly: "Composto anual",
			},
			types: {
				savingsAccount: "Conta poupança",
				termDeposit: "Depósito a prazo",
				savingsCertificates: "Certificados de Aforro",
				treasuryCertificates: "Certificados do Tesouro",
				bonds: "Obrigações",
				ppr: "PPR",
				pensionFund: "Fundo de pensões",
				other: "Outra",
			},
			confirmRemove: {
				title: "Remover {name}?",
				message:
					"Sai do teu registo com o histórico do que adicionaste e deixa de contar no orçamento e no simulador.",
				confirm: "Remover poupança",
			},
		},
		log: {
			show: "Ver histórico ({count})",
			hide: "Esconder histórico ({count})",
			start: "Início",
			purchase: "Compra",
			deposit: "Depósito",
			noDate: "Sem data",
			line: "{kind} · {date}",
			purchaseDetail: "{shares} ações a {price}",
		},
		portfolioStats: {
			title: "A tua carteira de investimentos",
			subtitle: "O que investiste e quanto vale agora.",
			invested: "Total investido",
			investedDetail: "O que saiu do teu bolso",
			value: "Valor atual",
			valueDetail: "Estimativa com o último preço",
			gain: "Ganho ou perda",
		},
		stats: {
			title: "Estatísticas da poupança",
			subtitle: "O que juntaste e os juros estimados até hoje.",
			total: "Total poupado",
			totalDetail: "Depósitos e juros",
			interestEarned: "Juros até hoje",
			interestEarnedDetail: "Estimativa depois de impostos",
			addedThisMonth: "Adicionado este mês",
			addedThisMonthDetail: "Às tuas poupanças",
			added: "Adicionado desde o início",
			addedDetail: "Sem adições | Numa adição | Em {count} adições",
			lastDeposit: "Última adição",
			lastDepositDetail: "O dia em que juntaste dinheiro",
			noDeposit: "Ainda não",
			splitTitle: "Por tipo de poupança",
			splitSubtitle: "Como está dividido o valor atual.",
		},
		confirmLeave: {
			title: "Sair sem guardar?",
			message:
				"Não conseguimos guardar as últimas alterações e perdem-se se saíres agora.",
			confirm: "Sair sem guardar",
		},
	},
	badges: {
		title: "O que estás a aplicar aqui",
		subtitle: "Os badges das aulas por trás deste ecrã.",
		count: "{earned} de {total}",
		earned: "Conquistado",
		items: {
			budgetOnTrack: {
				name: "Orçamento em Dia",
				lesson: "Termina o módulo de orçamento",
			},
			budgetRule: {
				name: "Regra 50/30/20",
				lesson: "Aula sobre dividir o salário",
			},
			solidFund: {
				name: "Fundo Sólido",
				lesson: "100% no quiz do fundo de emergência",
			},
			compoundInterest: {
				name: "Juros Compostos",
				lesson: "Aula sobre juros compostos",
			},
			inflation: {
				name: "Inflação",
				lesson: "Aula sobre inflação",
			},
			diversification: {
				name: "Diversificação",
				lesson: "Aula sobre diversificar",
			},
			prudentInvestor: {
				name: "Investidor Prudente",
				lesson: "Termina o trilho Strategist",
			},
		},
	},
};

export type MessageSchema = typeof pt;
