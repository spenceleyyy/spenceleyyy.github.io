#
# Shiny app: remove number-of-bins slider and use percentile range to trim outliers
#

library(shiny)
library(ggplot2)
library(tidyverse)
library(readr)

# Load data from CSV that lives in the app directory
# Make sure you have a file named "recent_grads.csv" in this folder
data <- read_csv("recent.grads.csv", show_col_types = FALSE)

majors_filtered <- data %>%
  group_by(Major_category) %>%
  filter(n() >= 8) %>%
  ungroup()

# Initial category summary (used mainly for ordering)
MONEYMAKING <- majors_filtered %>%
  group_by(Major_category) %>%
  summarise(
    mean_salary = mean(Median, na.rm = TRUE),
    sd_salary   = sd(Median,   na.rm = TRUE),
    n           = n(),
    .groups = "drop"
  )

overall_med <- median(majors_filtered$Median, na.rm = TRUE)

cat_summ <- MONEYMAKING %>%
  mutate(Major_category = fct_reorder(Major_category, mean_salary))

majors_plot <- majors_filtered %>%
  left_join(select(cat_summ, Major_category), by = "Major_category") %>%
  mutate(Major_category = fct_relevel(Major_category, levels(cat_summ$Major_category)))

# Define UI
ui <- fluidPage(
  
  # Application title
  titlePanel("Median Salary by Major Category"),
  
  sidebarLayout(
    sidebarPanel(
      # Range slider to keep data between chosen percentiles
      sliderInput(
        "keep_pct",
        "Remove outliers to see how data trends change:",
        min   = 0,
        max   = 100,
        value = c(0, 100),
        step  = 5
      )
    ),
    
    mainPanel(
      plotOutput("distPlot")
    )
  )
)

# Define server logic
server <- function(input, output) {
  
  output$distPlot <- renderPlot({
    
    # Convert selected percentiles to probabilities
    probs <- input$keep_pct / 100
    
    # Compute salary cutpoints for these percentiles
    qs <- quantile(majors_filtered$Median, probs = probs, na.rm = TRUE)
    lower <- qs[1]
    upper <- qs[2]
    
    # Filter data to keep only values between the chosen percentiles
    filtered_data <- majors_plot %>%
      filter(Median >= lower,
             Median <= upper)
    
    # Recompute category summary on filtered data
    filtered_cat_summ <- filtered_data %>%
      group_by(Major_category) %>%
      summarise(
        mean_salary = mean(Median, na.rm = TRUE),
        sd_salary   = sd(Median,   na.rm = TRUE),
        n           = n(),
        .groups = "drop"
      ) %>%
      # preserve original category order
      mutate(Major_category = factor(Major_category,
                                     levels = levels(majors_plot$Major_category)))
    
    # Overall median after trimming
    filtered_overall_med <- median(filtered_data$Median, na.rm = TRUE)
    
    ggplot() +
      geom_violin(
        data = filtered_data,
        aes(Major_category, Median, fill = Major_category)
      ) +
      geom_point(
        data = filtered_data,
        aes(Major_category, Median),
        position = position_jitter(width = 0.15),
        alpha = 0.4,
        size = 1
      ) +
      geom_pointrange(
        data = filtered_cat_summ,
        aes(
          Major_category,
          mean_salary,
          ymin = mean_salary - sd_salary,
          ymax = mean_salary + sd_salary
        )
      ) +
      geom_hline(yintercept = filtered_overall_med, linetype = "dashed") +
      coord_flip() +
      scale_y_continuous(labels = function(x) format(x, big.mark = ",", scientific = FALSE)) +
      theme(legend.position = "none")
  })
}

# Run the application 
shinyApp(ui = ui, server = server)