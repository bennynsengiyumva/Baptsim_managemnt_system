package com.church.baptism.service.system;

import com.zaxxer.hikari.HikariDataSource;
import org.springframework.stereotype.Service;

import javax.sql.DataSource;
import java.lang.management.ManagementFactory;
import java.lang.management.MemoryMXBean;
import java.lang.management.RuntimeMXBean;
import java.lang.management.ThreadMXBean;
import java.util.LinkedHashMap;
import java.util.Map;

@Service
public class SystemMonitoringService {

    private final DataSource dataSource;

    public SystemMonitoringService(DataSource dataSource) {
        this.dataSource = dataSource;
    }

    public Map<String, Object> getSystemStats() {
        Map<String, Object> stats = new LinkedHashMap<>();

        RuntimeMXBean runtimeMXBean = ManagementFactory.getRuntimeMXBean();
        MemoryMXBean memoryMXBean = ManagementFactory.getMemoryMXBean();
        ThreadMXBean threadMXBean = ManagementFactory.getThreadMXBean();

        stats.put("uptime", runtimeMXBean.getUptime());

        long totalMemory = Runtime.getRuntime().totalMemory();
        long freeMemory = Runtime.getRuntime().freeMemory();
        stats.put("totalMemory", totalMemory);
        stats.put("freeMemory", freeMemory);
        stats.put("usedMemory", totalMemory - freeMemory);

        stats.put("availableProcessors", Runtime.getRuntime().availableProcessors());
        stats.put("activeThreads", threadMXBean.getThreadCount());

        if (dataSource instanceof HikariDataSource hikariDataSource) {
            stats.put("dbPoolActive", hikariDataSource.getHikariPoolMXBean() != null
                    ? hikariDataSource.getHikariPoolMXBean().getActiveConnections() : 0);
            stats.put("dbPoolIdle", hikariDataSource.getHikariPoolMXBean() != null
                    ? hikariDataSource.getHikariPoolMXBean().getIdleConnections() : 0);
            stats.put("dbPoolMax", hikariDataSource.getMaximumPoolSize());
        }

        stats.put("timestamp", System.currentTimeMillis());

        return stats;
    }
}
